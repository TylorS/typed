import { dualWithTrace } from '@effect/data/Debug'

import { fromEffect } from '../conversion/fromEffect.js'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { withRefCounter } from '@typed/fx/internal/RefCounter'
import type { Cause, Context, Scope } from '@typed/fx/internal/externals'
import { Effect, pipe } from '@typed/fx/internal/externals'

export const catchAllCause: {
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<
    R | R2,
    E2,
    A | B
  >
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>) =>
      new CatchAllCauseFx(fx, f).traced(trace),
)

export const catchAllCauseEffect: {
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E2,
    A | B
  >
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>) =>
      new CatchAllCauseFx(fx, (a) => fromEffect(f(a))).traced(trace),
)

export class CatchAllCauseFx<R, E, A, R2, E2, B> extends BaseFx<R | R2, E2, A | B> {
  readonly name = 'CatchAllCause' as const

  constructor(readonly fx: Fx<R, E, A>, readonly f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>) {
    super()
  }

  run(sink: Sink<E | E2, A | B>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    return Effect.contextWithEffect((context: Context.Context<R | R2 | Scope.Scope>) =>
      withRefCounter(
        1,
        (counter) =>
          pipe(
            this.fx.run(
              Sink(
                sink.event,
                (cause) =>
                  pipe(
                    counter.increment,
                    Effect.zipRight(counter.refCounted(this.f(cause), sink, Effect.unit)),
                    Effect.forkScoped,
                    Effect.provideContext(context),
                  ),
                Effect.unit,
              ),
            ),
            // Allow the Effect completion to single completion
            Effect.zipLeft(counter.decrement),
          ),
        sink.end,
      ),
    )
  }
}
