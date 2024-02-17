/**
 * Create product types from products of Tags.
 * @since 1.0.0
 */

import type * as C from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

import { ContextBuilder } from "./Builder.js"
import type { Actions, Provision } from "./Extensions.js"

type TupleOfTags = ReadonlyArray<C.Tag<any, any>>

/**
 * A product type from a tuple of Tags
 * @since 1.0.0
 * @category models
 */
export interface TaggedTuple<Tags extends TupleOfTags> extends
  Actions<
    C.Tag.Identifier<Tags[number]>,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >,
  Provision<
    C.Tag.Identifier<Tags[number]>,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >,
  Effect.Effect<{ readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }, never, C.Tag.Identifier<Tags[number]>>
{
  readonly tags: Tags
}

/**
 * Create a TaggedTuple from a tuple of Tags
 * @since 1.0.0
 * @category constructors
 */
export function tuple<Tags extends TupleOfTags>(...tags: Tags): TaggedTuple<Tags> {
  const all = Effect.all(tags) as any as Effect.Effect<
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> },
    never,
    C.Tag.Identifier<Tags[number]>
  >

  const self: Omit<TaggedTuple<Tags>, keyof Effect.Effect<any, any, any>> = {
    tags,
    with: (f) => Effect.map(all, f),
    withEffect: (f) => Effect.flatMap(all, f),
    build: (s) => buildTupleContext(tags, s),
    provide: (s) => (effect) => Effect.provide(effect, buildTupleContext(tags, s).context),
    provideEffect: (make) => (effect) =>
      Effect.flatMap(make, (s) => Effect.provide(effect, buildTupleContext(tags, s).context)),
    layer: (make) =>
      Layer.effectContext(
        Effect.isEffect(make)
          ? Effect.map(make, (s) => buildTupleContext(tags, s).context)
          : Effect.succeed(buildTupleContext(tags, make).context)
      ),
    scoped: (make) => Layer.scopedContext(Effect.map(make, (s) => buildTupleContext(tags, s).context))
  }

  return Object.assign(all, self)
}

type StructOfTags = { readonly [key: PropertyKey]: C.Tag<any, any> }

/**
 * A product type from a struct of Tags
 * @since 1.0.0
 * @category models
 */
export interface TaggedStruct<Tags extends StructOfTags> extends
  Actions<
    C.Tag.Identifier<Tags[keyof Tags]>,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >,
  Provision<
    C.Tag.Identifier<Tags[keyof Tags]>,
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }
  >,
  Effect.Effect<
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> },
    never,
    C.Tag.Identifier<Tags[keyof Tags]>
  >
{
  readonly tags: Tags
}

/**
 * Create a TaggedStruct from a struct of Tags
 * @since 1.0.0
 * @category constructors
 */
export function struct<Tags extends StructOfTags>(tags: Tags): TaggedStruct<Tags> {
  const all = Effect.all(tags) as any as Effect.Effect<
    { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> },
    never,
    C.Tag.Identifier<Tags[keyof Tags]>
  >

  const self: Omit<TaggedStruct<Tags>, keyof Effect.Effect<any, any, any>> = {
    tags,
    with: (f) => Effect.map(all, f),
    withEffect: (f) => Effect.flatMap(all, f),
    build: (s) => buildStructContext(tags, s),
    provide: (s) => (effect) => Effect.provide(effect, buildStructContext(tags, s).context),
    provideEffect: (make) => (effect) =>
      Effect.flatMap(make, (s) => Effect.provide(effect, buildStructContext(tags, s).context)),
    layer: (make) =>
      Layer.effectContext(
        Effect.isEffect(make)
          ? Effect.map(make, (s) => buildStructContext(tags, s).context)
          : Effect.succeed(buildStructContext(tags, make).context)
      ),
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
