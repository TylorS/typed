import { identity } from '@fp-ts/data/Function'

export interface Effect<Resources, Errors, Output>
  extends Effect.Variance<Resources, Errors, Output> {
  readonly [Symbol.iterator]: () => Generator<Effect<Resources, Errors, Output>, Output, Output>
}

export namespace Effect {
  export const TypeId = Symbol.for('@typed/io/Effect')
  export type TypeId = typeof TypeId

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ResourcesOf<T> = [T] extends [Effect<infer R, infer _E, infer _A>] ? R : never
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ErrorsOf<T> = [T] extends [Effect<infer _R, infer E, infer _A>] ? E : never
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type OutputOf<T> = [T] extends [Effect<infer _R, infer _E, infer A>] ? A : never

  /**
   * This is utilized to help TypeScript understand the variance of the Effect
   * within the type system. This helps ensure that inference works as expected.
   */
  export interface Variance<R, E, A> {
    readonly [TypeId]: {
      readonly _R: (_: never) => R
      readonly _E: (_: never) => E
      readonly _A: (_: never) => A
    }
  }

  export const Variance: Variance<any, any, any>[TypeId] = {
    _R: identity,
    _E: identity,
    _A: identity,
  }

  export interface Of<A> extends Effect<never, never, A> {}

  export interface IO<E, A> extends Effect<never, E, A> {}

  export interface RIO<R, A> extends Effect<R, never, A> {}
}
