import { identity } from '@fp-ts/data/Function'

export interface Effect<R, E, A> extends Effect.Variance<R, E, A> {
  readonly [Symbol.iterator]: () => Generator<Effect<R, E, any>, A, any>
}

export namespace Effect {
  export const TypeId = Symbol('@typed/effect')
  export type TypeId = typeof TypeId

  export interface Variance<R, E, A> {
    readonly [TypeId]: {
      readonly _R: (_: never) => R
      readonly _E: (_: never) => E
      readonly _A: (_: never) => A
    }
  }

  export const Variance: Variance<any, any, any> = {
    [TypeId]: {
      _R: identity,
      _E: identity,
      _A: identity,
    },
  }
}
