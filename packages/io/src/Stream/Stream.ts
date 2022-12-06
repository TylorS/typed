import { identity } from '@fp-ts/data/Function'
import { Cause } from '@typed/cause'

import { Effect } from '../Effect.js'

export interface Stream<R, E, A> extends Stream.Variance<R, E, A> {
  readonly run: <R2>(sink: Sink<R2, E, A>) => Effect<R | R2, E, unknown>
}

export function Stream<R, E, A>(run: Stream<R, E, A>['run']): Stream<R, E, A> {
  return {
    [Stream.TypeId]: Stream.Variance,
    run,
  }
}

export namespace Stream {
  export const TypeId = Symbol.for('@typed/io/Stream')
  export type TypeId = typeof TypeId

  export interface Variance<R, E, A> {
    readonly [TypeId]: {
      readonly _R: (_: R) => void
      readonly _E: (_: E) => void
      readonly _A: (_: A) => void
    }
  }

  export const Variance: Variance<any, any, any>[TypeId] = {
    _R: identity,
    _E: identity,
    _A: identity,
  }

  export interface Of<A> extends Stream<never, never, A> {}
  export interface IO<E, A> extends Stream<never, E, A> {}
  export interface RIO<R, A> extends Stream<R, never, A> {}
}

export interface Sink<R, E, A> {
  readonly event: (a: A) => Effect.RIO<R, unknown>
  readonly error: (e: Cause<E>) => Effect.RIO<R, unknown>
  readonly end: Effect.RIO<R, unknown>
}

export function Sink<A, R, E, R2, R3>(
  event: (a: A) => Effect.RIO<R, unknown>,
  error: (e: Cause<E>) => Effect.RIO<R2, unknown>,
  end: Effect.RIO<R3, unknown>,
): Sink<R | R2 | R3, E, A> {
  return { event, error, end }
}
