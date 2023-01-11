import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import * as C from '@fp-ts/data/Context'
import { flow } from '@fp-ts/data/Function'
import * as Fx from '@typed/fx'

/**
 * Provides extensions to the `Context` module's Tag implementation to
 * provide a more ergonomic API for working with Effect + Fx.
 */
export interface Tag<S> extends C.Tag<S> {
  /**
   * Get the service from the environment
   */
  readonly get: Effect.Effect<S, never, S>
  /**
   * Apply a function to the service in the environment
   */
  readonly with: <A>(f: (s: S) => A) => Effect.Effect<S, never, A>
  /**
   * Perform an Effect with the service in the environment
   */
  readonly withEffect: <R, E, A>(f: (t: S) => Effect.Effect<R, E, A>) => Effect.Effect<R | S, E, A>
  /**
   * Run an Fx with the service in the environment
   */
  readonly withFx: <R, E, A>(f: (t: S) => Fx.Fx<R, E, A>) => Fx.Fx<R | S, E, A>

  /**
   * Provide the service to an Effect
   */
  readonly provide: (
    s: S,
  ) => <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<Exclude<R, S>, E, A>

  /**
   * Provide the service to an Fx
   */
  readonly provideFx: (s: S) => <R, E, A>(fx: Fx.Fx<R, E, A>) => Fx.Fx<Exclude<R, S>, E, A>

  /**
   * Create a Layer using an Effect
   */
  readonly layer: <R, E>(effect: Effect.Effect<R, E, S>) => Layer.Layer<R, E, S>

  /**
   * Create a Layer using a Scoped Effect
   */
  readonly layerSoped: <R, E>(effect: Effect.Effect<R | Scope.Scope, E, S>) => Layer.Layer<R, E, S>

  /**
   * Create a Layer from the service
   */
  readonly layerOf: (s: S) => Layer.Layer<never, never, S>

  /**
   * Helper for building a Context
   */
  readonly build: (s: S) => ContextBuilder<S>
}

const empty_ = C.empty()

const buildContext =
  <S>(tag: C.Tag<S>) =>
  (s: S) =>
    C.add(tag)(s)(empty_)

export function Tag<A>(key?: string): Tag<A> {
  const tag = C.Tag<A>(key)

  return Object.assign(tag, {
    get: Effect.service(tag),
    with: Effect.serviceWith(tag),
    withEffect: Effect.serviceWithEffect(tag),
    withFx: Fx.serviceWithFx(tag),
    provide: Effect.provideService(tag),
    provideFx: Fx.provideService(tag),
    layer: Effect.toLayer(tag),
    layerSoped: Layer.scoped(tag),
    layerOf: flow(Effect.succeed<A>, Effect.toLayer(tag)),
    build: flow(buildContext(tag), makeContextBuilder),
  })
}

export namespace Tag {
  export type ServiceOf<T> = [T] extends [never] ? never : [T] extends [C.Tag<infer S>] ? S : never
}

export type ServiceOf<T> = Tag.ServiceOf<T>

export interface ContextBuilder<R> {
  readonly context: C.Context<R>
  readonly add: <S>(tag: C.Tag<S>, a: S) => ContextBuilder<R | S>
  readonly merge: <S>(builder: ContextBuilder<S>) => ContextBuilder<R | S>
  readonly mergeContext: <S>(context: C.Context<S>) => ContextBuilder<R | S>
  readonly prune: <Tags extends Array<C.Tags<R>>>(
    ...tags: Tags
  ) => ContextBuilder<ServiceOf<Tags[number]>>
}

export function makeContextBuilder<R = never>(
  context: C.Context<R> = C.empty() as C.Context<R>,
): ContextBuilder<R> {
  const builder: ContextBuilder<R> = {
    context,
    add: <A>(tag: C.Tag<A>, a: A) => makeContextBuilder(C.add(tag)(a)(context)),
    merge: <S>(builder: ContextBuilder<S>) => makeContextBuilder(C.merge(builder.context)(context)),
    mergeContext: <S>(other: C.Context<S>) => makeContextBuilder(C.merge(other)(context)),
    prune: <Tags extends Array<C.Tags<R>>>(
      ...tags: Tags
    ): ContextBuilder<ServiceOf<Tags[number]>> =>
      makeContextBuilder(C.prune<R, Tags>(...tags)(context)) as ContextBuilder<
        ServiceOf<Tags[number]>
      >,
  }

  return builder
}

export {
  Context,
  isContext,
  isTag,
  empty,
  get,
  unsafeGet,
  getOption,
  add,
  merge,
  prune,
} from '@fp-ts/data/Context'
