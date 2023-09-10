import type * as C from "@effect/data/Context"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"

import { ContextBuilder } from "./Builder"
import type { Actions, Builder, Layers, Provide, Tagged } from "./Interface"

type TupleOfTags = ReadonlyArray<C.Tag<any, any>>

export type TaggedTuple<Tags extends TupleOfTags> =
  & Tagged<
    C.Tag.Identifier<Tags[number]>,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >
  & {
    readonly tags: Tags
  }
  & Effect.Effect<
    C.Tag.Identifier<Tags[number]>,
    never,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >

export function tuple<Tags extends TupleOfTags>(...tags: Tags): TaggedTuple<Tags> {
  return Object.assign(Effect.all(tags) as any, {
    ...tupleActions(tags),
    ...tupleProvide(tags),
    ...tupleLayers(tags),
    ...tupleBuilder(tags),
    tags
  })
}

type TupleTagActions<Tags extends TupleOfTags> = Actions<
  C.Tag.Identifier<Tags[number]>,
  { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
>

function tupleActions<Tags extends TupleOfTags>(tags: Tags): TupleTagActions<Tags> {
  const all = Effect.all(tags) as any as Effect.Effect<
    C.Tag.Identifier<Tags[number]>,
    never,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >

  return {
    with: (f) => Effect.map(all, f),
    withEffect: (f) => Effect.flatMap(all, f)
  }
}

type TupleTagProvide<Tags extends TupleOfTags> = Provide<
  C.Tag.Identifier<Tags[number]>,
  { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
>

function tupleProvide<Tags extends TupleOfTags>(tags: Tags): TupleTagProvide<Tags> {
  return {
    provide: (s) => {
      const toProvide = tags.map((tag, i) => Effect.provideService(tag, s[i]))

      return (effect) => toProvide.reduce((acc, f) => f(acc), effect) as any
    },
    provideEffect: (service) => (effect) =>
      service.pipe(
        Effect.flatMap((s) => {
          const toProvide = tags.map((tag, i) => Effect.provideService(tag, s[i]))

          return toProvide.reduce((acc, f) => f(acc), effect) as any
        })
      ) as any
  }
}

type TupleTagLayers<Tags extends TupleOfTags> = Layers<
  C.Tag.Identifier<Tags[number]>,
  { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
>

function tupleLayers<Tags extends TupleOfTags>(tags: Tags): TupleTagLayers<Tags> {
  return {
    layerOf: (s) => Layer.succeedContext(buildTupleContext(tags, s).context),
    layer: (effect) => Layer.effectContext(Effect.map(effect, (s) => buildTupleContext(tags, s).context)),
    scoped: (effect) => Layer.scopedContext(Effect.map(effect, (s) => buildTupleContext(tags, s).context))
  }
}

type TupleTagBuilder<Tags extends TupleOfTags> = Builder<
  C.Tag.Identifier<Tags[number]>,
  { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
>

function tupleBuilder<Tags extends TupleOfTags>(tags: Tags): TupleTagBuilder<Tags> {
  return {
    build: (s) => buildTupleContext(tags, s)
  }
}

function buildTupleContext<Tags extends TupleOfTags>(
  tags: Tags,
  services: {
    readonly [K in keyof Tags]: C.Tag.Service<Tags[K]>
  }
) {
  let builder = ContextBuilder.empty

  for (let i = 0; i < tags.length; ++i) {
    builder = builder.add(tags[i], services[i])
  }

  return builder as ContextBuilder<C.Tag.Identifier<Tags[number]>>
}

type StructOfTags = { readonly [key: PropertyKey]: C.Tag<any, any> }

export type TaggedStruct<Tags extends StructOfTags> =
  & Tagged<
    C.Tag.Identifier<Tags[keyof Tags]>,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >
  & {
    readonly tags: Tags
  }
  & Effect.Effect<
    C.Tag.Identifier<Tags[keyof Tags]>,
    never,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >

export function struct<Tags extends StructOfTags>(tags: Tags): TaggedStruct<Tags> {
  return Object.assign(Effect.all(tags) as any, {
    ...structActions(tags),
    ...structProvide(tags),
    ...structLayers(tags),
    ...structBuilder(tags),
    tags
  })
}

type StructTagActions<Tags extends StructOfTags> = Actions<
  C.Tag.Identifier<Tags[keyof Tags]>,
  { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
>

function structActions<Tags extends StructOfTags>(tags: Tags): StructTagActions<Tags> {
  const all = Effect.all(tags) as any as Effect.Effect<
    C.Tag.Identifier<Tags[keyof Tags]>,
    never,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >

  return {
    with: (f) => Effect.map(all, f),
    withEffect: (f) => Effect.flatMap(all, f)
  }
}

type StructTagProvide<Tags extends StructOfTags> = Provide<
  C.Tag.Identifier<Tags[keyof Tags]>,
  { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
>

function structProvide<Tags extends StructOfTags>(tags: Tags): StructTagProvide<Tags> {
  return {
    provide: (s) => {
      const toProvide = Object.keys(tags).map((key) => Effect.provideService(tags[key], s[key]))

      return (effect) => toProvide.reduce((acc, f) => f(acc), effect) as any
    },
    provideEffect: (service) => (effect) =>
      service.pipe(
        Effect.flatMap((s) => {
          const toProvide = Object.keys(tags).map((key) => Effect.provideService(tags[key], s[key]))

          return toProvide.reduce((acc, f) => f(acc), effect) as any
        })
      ) as any
  }
}

type StructTagLayers<Tags extends StructOfTags> = Layers<
  C.Tag.Identifier<Tags[keyof Tags]>,
  { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
>

function structLayers<Tags extends StructOfTags>(tags: Tags): StructTagLayers<Tags> {
  return {
    layerOf: (s) => Layer.succeedContext(buildStructContext(tags, s).context),
    layer: (effect) => Layer.effectContext(Effect.map(effect, (s) => buildStructContext(tags, s).context)),
    scoped: (effect) => Layer.scopedContext(Effect.map(effect, (s) => buildStructContext(tags, s).context))
  }
}

type StructTagBuilder<Tags extends StructOfTags> = Builder<
  C.Tag.Identifier<Tags[keyof Tags]>,
  { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
>

function structBuilder<Tags extends StructOfTags>(tags: Tags): StructTagBuilder<Tags> {
  return {
    build: (s) => buildStructContext(tags, s)
  }
}

function buildStructContext<Tags extends StructOfTags>(
  tags: Tags,
  services: {
    readonly [K in keyof Tags]: C.Tag.Service<Tags[K]>
  }
) {
  let builder = ContextBuilder.empty

  for (const key of Reflect.ownKeys(tags)) {
    builder = builder.add(tags[key], services[key])
  }

  return builder as ContextBuilder<C.Tag.Identifier<Tags[keyof Tags]>>
}
