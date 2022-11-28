import { identity } from '@fp-ts/data/Function'

import { Effect } from '../effect/Effect.js'

import { Sink } from './Sink.js'

export interface Fx<R, E, A> extends Fx.Variance<R, E, A> {
  readonly run: <R2>(sink: Sink<R2, E, A>) => Effect<R | R2, E, unknown>
}

export namespace Fx {
  export const TypeId = Symbol('@typed/fx')
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
