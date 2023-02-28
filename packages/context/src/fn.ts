import { flow, pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'

import { Tag } from './context.js'

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

  export const Brand = Symbol.for('@typed/context/EffectFn/Brand')
  export type Brand = typeof Brand

  export type Branded<Key extends string, T extends EffectFn> = T & { readonly [Brand]: Key }
}

/**
 * Fn is a helper for creating contextual services that are single functions that return
 * an Effect.
 */
export interface Fn<Key extends string, T extends EffectFn>
  // Brand T so that functions do not collide so easily
  extends Tag<EffectFn.Branded<Key, T>> {
  readonly key: Key

  /**
   * Call your effectful function with the provided arguments.
   */
  readonly apply: <Args extends EffectFn.ArgsOf<T>>(
    ...args: Args
  ) => Effect.Effect<
    EffectFn.Branded<Key, T> | EffectFn.ResourcesOf<T>,
    EffectFn.ErrorsOf<T>,
    EffectFn.OutputOf<T>
  >

  /**
   * Access your effect-ful function and perform an effect with it.
   * Useful when your function has a type-parameter you don't want to lose
   * like you will with `apply`.
   */
  readonly access: <R, E, A>(
    f: (t: T) => Effect.Effect<R, E, A>,
  ) => Effect.Effect<EffectFn.Branded<Key, T> | R, E | EffectFn.ErrorsOf<T>, A>

  /**
   * A helper to implement a Layer for your effectful function which
   * has more context requirements than the interface it is implementing.
   */
  readonly implement: <T2 extends EffectFn.Extendable<T>>(
    implementation: T2,
  ) => Layer.Layer<EffectFn.ResourcesOf<T2>, never, EffectFn.Branded<Key, T>>
}

/**
 * Create a new Fn
 */
export function Fn<T extends EffectFn>() {
  // Key is provided in a second function to allow inference to work without duplicating your typing
  return <K extends string>(key: K): Fn<K, T> => {
    const tag = Tag<EffectFn.Branded<K, T>>(key)

    const access = <R, E, A>(f: (t: T) => Effect.Effect<R, E, A>) =>
      pipe(tag.get, Effect.flatMap(f))

    return Object.assign(tag, {
      key,
      access,
      apply: (...args: EffectFn.ArgsOf<T>) => access((f) => f(...args)),
      implement: <T2 extends EffectFn.Extendable<T>>(
        implementation: T2,
      ): Layer.Layer<EffectFn.ResourcesOf<T2>, never, EffectFn.Branded<K, T>> =>
        tag.layer(
          Effect.gen(function* ($) {
            const layer = Layer.succeedContext(yield* $(Effect.context<EffectFn.ResourcesOf<T2>>()))

            return flow(implementation, Effect.provideSomeLayer(layer)) as EffectFn.Branded<K, T>
          }),
        ),
    } as const)
  }
}

export namespace Fn {
  export type KeyOf<T extends Fn<any, any>> = T extends Fn<infer K, any> ? K : never
  export type FnOf<T extends Fn<any, any>> = T extends Fn<any, infer F> ? F : never

  export type Service<T extends Fn<any, any>> = EffectFn.Branded<KeyOf<T>, FnOf<T>>
}
