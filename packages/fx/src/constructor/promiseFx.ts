import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'

import { Fx } from '../Fx.js'

export const promiseFx = <R, E, A>(f: () => Promise<Fx<R, E, A>>): Fx<R, E, A> =>
  Fx((sink) =>
    pipe(
      Effect.promise(f),
      Effect.matchCauseEffect(sink.error, (fx) => fx.run(sink)),
    ),
  )

export const promiseInterruptFx = <R, E, A>(
  f: (signal: AbortSignal) => Promise<Fx<R, E, A>>,
): Fx<R, E, A> =>
  Fx((sink) =>
    pipe(
      Effect.promiseInterrupt(f),
      Effect.matchCauseEffect(sink.error, (fx) => fx.run(sink)),
    ),
  )

export const tryCatchPromiseFx = <R, E, A, E2>(
  f: () => Promise<Fx<R, E, A>>,
  onError: (u: unknown) => E2,
): Fx<R, E | E2, A> =>
  Fx((sink) =>
    pipe(
      Effect.tryCatchPromise(f, onError),
      Effect.matchCauseEffect(sink.error, (fx) => fx.run(sink)),
    ),
  )

export const tryCatchPromiseInterruptFx = <R, E, A, E2>(
  f: (signal: AbortSignal) => Promise<Fx<R, E, A>>,
  onError: (u: unknown) => E2,
): Fx<R, E | E2, A> =>
  Fx((sink) =>
    pipe(
      Effect.tryCatchPromiseInterrupt(f, onError),
      Effect.matchCauseEffect(sink.error, (fx) => fx.run(sink)),
    ),
  )
