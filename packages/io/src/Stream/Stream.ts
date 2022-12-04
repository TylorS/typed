import { identity } from '@fp-ts/data/Function'
import { Cause } from '@typed/cause'
import { Time } from '@typed/time'

import { Effect } from '../Effect.js'
import { Scheduler } from '../Scheduler.js'

export interface Stream<R, E, A> extends Stream.Variance<R, E, A> {
  readonly run: <R2>(sink: Sink<R2, E, A>, scheduler: Scheduler) => Effect<R | R2, E, unknown>
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
}

export interface Sink<R, E, A> {
  readonly event: (time: Time, a: A) => Effect.RIO<R, unknown>
  readonly error: (time: Time, e: Cause<E>) => Effect.RIO<R, unknown>
  readonly end: (time: Time) => Effect.RIO<R, unknown>
}

export function Sink<A, R, E, R2, R3>(
  event: (time: Time, a: A) => Effect.RIO<R, unknown>,
  error: (time: Time, e: Cause<E>) => Effect.RIO<R2, unknown>,
  end: (time: Time) => Effect.RIO<R3, unknown>,
): Sink<R | R2 | R3, E, A> {
  return { event, error, end }
}
