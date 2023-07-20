import * as C from '@effect/data/Context'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Fx from '@typed/fx'

import { ContextBuilder } from './builder.js'
import { Tag } from './context.js'
import { Actions, Builder, Layers, Provide, Tagged } from './interfaces.js'

type TupleOfTags = ReadonlyArray<C.Tag<any, any>>

export type TaggedTuple<Tags extends TupleOfTags> = Tagged<
  Tag.Identifier<Tags[number]>,
  { readonly [K in keyof Tags]: Tag.Service<Tags[K]> }
> & {
  readonly tags: Tags
}

export function tuple<Tags extends TupleOfTags>(...tags: Tags): TaggedTuple<Tags> {
  return {
    ...tupleActions(tags),
    ...tupleProvide(tags),
    ...tupleLayers(tags),
    ...tupleBuilder(tags),
    tags,
  }
}

type TupleTagActions<Tags extends TupleOfTags> = Actions<
  Tag.Identifier<Tags[number]>,
  { readonly [K in keyof Tags]: Tag.Service<Tags[K]> }
>

function tupleActions<Tags extends TupleOfTags>(tags: Tags): TupleTagActions<Tags> {
  const all = Effect.all(tags) as any as Effect.Effect<
    Tag.Identifier<Tags[number]>,
    never,
    { readonly [K in keyof Tags]: Tag.Service<Tags[K]> }
  >

  return {
    with: (f) => Effect.map(all, f),
    withEffect: (f) => Effect.flatMap(all, f),
    withFx: (f) => Fx.fromFxEffect(Effect.map(all, f)),
  }
}

type TupleTagProvide<Tags extends TupleOfTags> = Provide<
  Tag.Identifier<Tags[number]>,
  { readonly [K in keyof Tags]: Tag.Service<Tags[K]> }
>

function tupleProvide<Tags extends TupleOfTags>(tags: Tags): TupleTagProvide<Tags> {
  return {
    provide: (s) => {
      const toProvide = tags.map((tag, i) => Effect.provideService(tag, s[i]))

      return (effect) => toProvide.reduce((acc, f) => f(acc), effect) as any
    },
    provideFx: (s) => {
      const toProvide = tags.map((tag, i) => Fx.provideService(tag, s[i]))

      return (fx) => toProvide.reduce((acc, f) => f(acc), fx) as any
    },
  }
}

type TupleTagLayers<Tags extends TupleOfTags> = Layers<
  Tag.Identifier<Tags[number]>,
  { readonly [K in keyof Tags]: Tag.Service<Tags[K]> }
>

function tupleLayers<Tags extends TupleOfTags>(tags: Tags): TupleTagLayers<Tags> {
  return {
    layerOf: (s) => Layer.succeedContext(buildTupleContext(tags, s).context),
    layer: (effect) =>
      Layer.effectContext(Effect.map(effect, (s) => buildTupleContext(tags, s).context)),
    layerScoped: (effect) =>
      Layer.scopedContext(Effect.map(effect, (s) => buildTupleContext(tags, s).context)),
  }
}

type TupleTagBuilder<Tags extends TupleOfTags> = Builder<
  Tag.Identifier<Tags[number]>,
  { readonly [K in keyof Tags]: Tag.Service<Tags[K]> }
>

function tupleBuilder<Tags extends TupleOfTags>(tags: Tags): TupleTagBuilder<Tags> {
  return {
    build: (s) => buildTupleContext(tags, s),
  }
}

function buildTupleContext<Tags extends TupleOfTags>(
  tags: Tags,
  services: {
    readonly [K in keyof Tags]: Tag.Service<Tags[K]>
  },
) {
  let builder = ContextBuilder.empty

  for (let i = 0; i < tags.length; ++i) {
    builder = builder.add(tags[i], services[i])
  }

  return builder as ContextBuilder<Tag.Identifier<Tags[number]>>
}

type StructOfTags = { readonly [key: PropertyKey]: C.Tag<any, any> }

export type TaggedStruct<Tags extends StructOfTags> = Tagged<
  Tag.Identifier<Tags[keyof Tags]>,
  { readonly [K in keyof Tags]: Tag.Service<Tags[K]> }
> & {
  readonly tags: Tags
}

export function struct<Tags extends StructOfTags>(tags: Tags): TaggedStruct<Tags> {
  return {
    ...structActions(tags),
    ...structProvide(tags),
    ...structLayers(tags),
    ...structBuilder(tags),
    tags,
  }
}

type StructTagActions<Tags extends StructOfTags> = Actions<
  Tag.Identifier<Tags[keyof Tags]>,
  { readonly [K in keyof Tags]: Tag.Service<Tags[K]> }
>

function structActions<Tags extends StructOfTags>(tags: Tags): StructTagActions<Tags> {
  const all = Effect.all(tags) as any as Effect.Effect<
    Tag.Identifier<Tags[keyof Tags]>,
    never,
    { readonly [K in keyof Tags]: Tag.Service<Tags[K]> }
  >

  return {
    with: (f) => Effect.map(all, f),
    withEffect: (f) => Effect.flatMap(all, f),
    withFx: (f) => Fx.fromFxEffect(Effect.map(all, f)),
  }
}

type StructTagProvide<Tags extends StructOfTags> = Provide<
  Tag.Identifier<Tags[keyof Tags]>,
  { readonly [K in keyof Tags]: Tag.Service<Tags[K]> }
>

function structProvide<Tags extends StructOfTags>(tags: Tags): StructTagProvide<Tags> {
  return {
    provide: (s) => {
      const toProvide = Object.keys(tags).map((key) => Effect.provideService(tags[key], s[key]))

      return (effect) => toProvide.reduce((acc, f) => f(acc), effect) as any
    },
    provideFx: (s) => {
      const toProvide = Object.keys(tags).map((key) => Fx.provideService(tags[key], s[key]))

      return (fx) => toProvide.reduce((acc, f) => f(acc), fx) as any
    },
  }
}

type StructTagLayers<Tags extends StructOfTags> = Layers<
  Tag.Identifier<Tags[keyof Tags]>,
  { readonly [K in keyof Tags]: Tag.Service<Tags[K]> }
>

function structLayers<Tags extends StructOfTags>(tags: Tags): StructTagLayers<Tags> {
  return {
    layerOf: (s) => Layer.succeedContext(buildStructContext(tags, s).context),
    layer: (effect) =>
      Layer.effectContext(Effect.map(effect, (s) => buildStructContext(tags, s).context)),
    layerScoped: (effect) =>
      Layer.scopedContext(Effect.map(effect, (s) => buildStructContext(tags, s).context)),
  }
}

type StructTagBuilder<Tags extends StructOfTags> = Builder<
  Tag.Identifier<Tags[keyof Tags]>,
  { readonly [K in keyof Tags]: Tag.Service<Tags[K]> }
>

function structBuilder<Tags extends StructOfTags>(tags: Tags): StructTagBuilder<Tags> {
  return {
    build: (s) => buildStructContext(tags, s),
  }
}

function buildStructContext<Tags extends StructOfTags>(
  tags: Tags,
  services: {
    readonly [K in keyof Tags]: Tag.Service<Tags[K]>
  },
) {
  let builder = ContextBuilder.empty

  for (const key of Reflect.ownKeys(tags)) {
    builder = builder.add(tags[key], services[key])
  }

  return builder as ContextBuilder<Tag.Identifier<Tags[keyof Tags]>>
}
