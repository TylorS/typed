import type * as C from "@effect/data/Context"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"

import { ContextBuilder } from "./Builder"
import type { Tagged } from "./Interface"

type TupleOfTags = ReadonlyArray<C.Tag<any, any>>

export interface TaggedTuple<Tags extends TupleOfTags> extends
  Tagged<
    C.Tag.Identifier<Tags[number]>,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >,
  Effect.Effect<C.Tag.Identifier<Tags[number]>, never, { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }>
{
  readonly tags: Tags
}

export function tuple<Tags extends TupleOfTags>(...tags: Tags): TaggedTuple<Tags> {
  const all = Effect.all(tags) as any as Effect.Effect<
    C.Tag.Identifier<Tags[number]>,
    never,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >

  const self: Omit<TaggedTuple<Tags>, keyof Effect.Effect<any, any, any>> = {
    tags,
    with: (f) => Effect.map(all, f),
    withEffect: (f) => Effect.flatMap(all, f),
    build: (s) => buildTupleContext(tags, s),
    provide: (s) => (effect) => Effect.provideSomeContext(effect, buildTupleContext(tags, s).context),
    provideEffect: (make) => (effect) =>
      Effect.flatMap(make, (s) => Effect.provideSomeContext(effect, buildTupleContext(tags, s).context)),
    layer: (make) => Layer.effectContext(Effect.map(make, (s) => buildTupleContext(tags, s).context)),
    scoped: (make) => Layer.scopedContext(Effect.map(make, (s) => buildTupleContext(tags, s).context))
  }

  return Object.assign(all, self)
}

type StructOfTags = { readonly [key: PropertyKey]: C.Tag<any, any> }

export interface TaggedStruct<Tags extends StructOfTags> extends
  Tagged<
    C.Tag.Identifier<Tags[keyof Tags]>,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >,
  Effect.Effect<C.Tag.Identifier<Tags[keyof Tags]>, never, { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }>
{
  readonly tags: Tags
}

export function struct<Tags extends StructOfTags>(tags: Tags): TaggedStruct<Tags> {
  const all = Effect.all(tags) as any as Effect.Effect<
    C.Tag.Identifier<Tags[keyof Tags]>,
    never,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >

  const self: Omit<TaggedStruct<Tags>, keyof Effect.Effect<any, any, any>> = {
    tags,
    with: (f) => Effect.map(all, f),
    withEffect: (f) => Effect.flatMap(all, f),
    build: (s) => buildStructContext(tags, s),
    provide: (s) => (effect) => Effect.provideSomeContext(effect, buildStructContext(tags, s).context),
    provideEffect: (make) => (effect) =>
      Effect.flatMap(make, (s) => Effect.provideSomeContext(effect, buildStructContext(tags, s).context)),
    layer: (make) => Layer.effectContext(Effect.map(make, (s) => buildStructContext(tags, s).context)),
    scoped: (make) => Layer.scopedContext(Effect.map(make, (s) => buildStructContext(tags, s).context))
  }

  return Object.assign(all, self)
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
