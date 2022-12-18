import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import * as Fiber from '@effect/io/Fiber'
import * as Schedule from '@effect/io/Schedule'
import { Scope } from '@effect/io/Scope'
import { millis } from '@fp-ts/data/Duration'
import { flow, pipe } from '@fp-ts/data/Function'

import { Fx, Sink } from '../Fx.js'

const asyncStart = pipe(
  Schedule.once(),
  Schedule.delayed(() => millis(0)),
)

export function observe<A, R2, E2, B>(
  f: (a: A) => Effect.Effect<R2, E2, B>,
): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R | R2, E2 | E, void> {
  return flow(observe_(f), Effect.scoped)
}

export function observe_<A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) {
  return <R, E>(fx: Fx<R, E, A>): Effect.Effect<R | R2 | Scope, E | E2, void> =>
    Effect.gen(function* ($) {
      const deferred = yield* $(Deferred.make<E | E2, void>())
      const sink: Sink<R2, E | E2, A> = Sink(
        flow(
          f,
          Effect.foldCauseEffect((cause) => sink.error(cause), Effect.unit),
        ),
        (cause) => pipe(deferred, Deferred.done<E | E2, void>(Exit.failCause(cause))),
        pipe(deferred, Deferred.done<E | E2, void>(Exit.unit())),
      )

      const fiber = yield* $(pipe(fx.run(sink), Effect.scheduleForked(asyncStart)))

      yield* $(Deferred.await(deferred))
      yield* $(Fiber.interrupt(fiber))
    })
}
