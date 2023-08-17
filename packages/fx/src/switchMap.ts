import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'
import { withSwitch } from './helpers.js'

export function switchMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return Fx((sink) => withSwitch((fork) => fx.run(Sink((a) => fork(f(a).run(sink)), sink.error))))
}

export function switchMapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return Fx((sink) =>
    withSwitch((fork) =>
      fx.run(
        Sink(
          (a) =>
            fork(Effect.matchCauseEffect(f(a), { onFailure: sink.error, onSuccess: sink.event })),
          sink.error,
        ),
      ),
    ),
  )
}

export function switchLatest<R, E, R2, E2, B>(fx: Fx<R, E, Fx<R2, E2, B>>): Fx<R | R2, E | E2, B> {
  return switchMap(fx, (a) => a)
}

export function switchLatestEffect<R, E, R2, E2, B>(
  fx: Fx<R, E, Effect.Effect<R2, E2, B>>,
): Fx<R | R2, E | E2, B> {
  return switchMapEffect(fx, (a) => a)
}
