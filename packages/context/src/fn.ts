import { dual } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'

import { Tag } from './context.js'
import { IdentifierFactory, IdentifierInput, IdentifierOf } from './identifier.js'

export interface EffectFn<Args extends readonly any[] = readonly any[], R = any, E = any, A = any> {
  (...args: Args): Effect.Effect<R, E, A>
}

export namespace EffectFn {
  export type Extendable<T extends EffectFn> = T extends (
    ...args: infer Args
  ) => Effect.Effect<infer R, infer E, infer A>
    ? (...args: Args) => Effect.Effect<[R] extends [never] ? any : R, E, A>
    : never

  export type ArgsOf<T extends EffectFn> = T extends (
    ...args: infer Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer _R, infer _E, infer _A>
    ? Args
    : never

  export type ResourcesOf<T extends EffectFn> = T extends (
    ...args: infer _Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer R, infer _E, infer _A>
    ? R
    : never

  export type ErrorsOf<T extends EffectFn> = T extends (
    ...args: infer _Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer _R, infer E, infer _A>
    ? E
    : never

  export type OutputOf<T extends EffectFn> = T extends (
    ...args: infer _Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer _R, infer _E, infer A>
    ? A
    : never
}

/**
 * Fn is a helper for creating contextual services that are single functions that return
 * an Effect.
 */
export interface Fn<Key, T extends EffectFn>
  // Brand T so that functions do not collide so easily
  extends Tag<Key, T> {
  /**
   * Call your effectful function with the provided arguments.
   */
  readonly apply: <Args extends EffectFn.ArgsOf<T>>(
    ...args: Args
  ) => Effect.Effect<Key | EffectFn.ResourcesOf<T>, EffectFn.ErrorsOf<T>, EffectFn.OutputOf<T>>

  /**
   * A helper to implement a Layer for your effectful function which
   * has more context requirements than the interface it is implementing.
   */
  readonly implement: <T2 extends EffectFn.Extendable<T>>(
    implementation: T2,
  ) => Layer.Layer<EffectFn.ResourcesOf<T2>, never, Key>

  /**
   * A helper for implementing an providing a Layer to an Effect.
   */
  readonly provideImplementation: {
    <T2 extends EffectFn.Extendable<T>>(
      implementation: T2,
    ): <R, E, A>(
      effect: Effect.Effect<R, E, A>,
    ) => Effect.Effect<Exclude<R, Key> | EffectFn.ResourcesOf<T2>, E | EffectFn.ErrorsOf<T2>, A>

    <R, E, A, T2 extends EffectFn.Extendable<T>>(
      effect: Effect.Effect<R, E, A>,
      implementation: T2,
    ): Effect.Effect<Exclude<R, Key> | EffectFn.ResourcesOf<T2>, E | EffectFn.ErrorsOf<T2>, A>
  }
}

/**
 * Create a new Fn
 */
export function Fn<T extends EffectFn>() {
  function makeFn<const Id extends IdentifierFactory<any>>(id: Id): Fn<IdentifierOf<Id>, T>
  function makeFn<const Id>(id: Id): Fn<IdentifierOf<Id>, T>
  function makeFn<const Id extends IdentifierInput<any>>(id: Id): Fn<IdentifierOf<Id>, T> {
    // Add id for debugging
    return Object.assign(Fn.wrap(Tag<Id, T>(id)), { id })
  }

  return makeFn
}

export namespace Fn {
  export type KeyOf<T extends Fn<any, any>> = T extends Fn<infer K, any> ? K : never

  export type FnOf<T extends Fn<any, any>> = T extends Fn<any, infer F> ? F : never

  export type Any = Fn<any, any>

  export const wrap = <I, S extends EffectFn>(tag: Tag<I, S>): Fn<I, S> => {
    const implement = <T2 extends EffectFn.Extendable<S>>(
      implementation: T2,
    ): Layer.Layer<EffectFn.ResourcesOf<T2>, never, I> =>
      tag.layer(
        Effect.map(
          Effect.context<EffectFn.ResourcesOf<T2>>(),
          (c) => ((...a: any) => Effect.provideSomeContext(implementation(...a), c)) as any,
        ),
      )

    return Object.assign(tag, {
      apply: (...args: EffectFn.ArgsOf<S>) => tag.withEffect((f) => f(...args)),
      implement,
      provideImplementation: dual(
        2,
        <R, E, A, T2 extends EffectFn.Extendable<S>>(
          effect: Effect.Effect<R, E, A>,
          implementation: T2,
        ): Effect.Effect<Exclude<R, I> | EffectFn.ResourcesOf<T2>, E | EffectFn.ErrorsOf<T2>, A> =>
          Effect.provideSomeLayer(effect, implement(implementation)),
      ),
    })
  }
}
