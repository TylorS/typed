import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

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
