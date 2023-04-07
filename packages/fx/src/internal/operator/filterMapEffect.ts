import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Context, Scope } from '@typed/fx/internal/externals'
import { Effect, Option } from '@typed/fx/internal/externals'

export const filterMapEffect: {
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): Fx<
    R | R2,
    E | E2,
    B
  >

  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): <R, E>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      self: Fx<R, E, A>,
      f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
    ): Fx<R | R2, E | E2, B> =>
      new FilterMapEffectFx(self, f).traced(trace),
)

export const filterEffect: {
  <R, E, A, R2, E2>(self: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<
    R | R2,
    E | E2,
    A
  >

  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2>(
      self: Fx<R, E, A>,
      f: (a: A) => Effect.Effect<R2, E2, boolean>,
    ): Fx<R | R2, E | E2, A> =>
      filterMapEffect(self, (a) =>
        Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())),
      ).traced(trace),
)

export const filterNotEffect: {
  <R, E, A, R2, E2>(self: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<
    R | R2,
    E | E2,
    A
  >

  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2>(
      self: Fx<R, E, A>,
      f: (a: A) => Effect.Effect<R2, E2, boolean>,
    ): Fx<R | R2, E | E2, A> =>
      filterMapEffect(self, (a) =>
        Effect.map(f(a), (b) => (b ? Option.none() : Option.some(a))),
      ).traced(trace),
)

export class FilterMapEffectFx<R, E, A, R2, E2, B> extends BaseFx<R | R2, E | E2, B> {
  readonly name = 'FilterMapEffect' as const

  constructor(
    readonly fx: Fx<R, E, A>,
    readonly f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  ) {
    super()
  }

  run(sink: Sink<E | E2, B>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    return Effect.contextWithEffect((ctx: Context.Context<R | R2 | Scope.Scope>) => {
      const lock = Effect.unsafeMakeSemaphore(1).withPermits(1)

      return this.fx.run(
        Sink(
          (a) =>
            lock(
              Effect.provideContext(
                Effect.matchCauseEffect(
                  this.f(a),
                  sink.error,
                  Option.match(Effect.unit, sink.event),
                ),
                ctx,
              ),
            ),
          sink.error,
          sink.end,
        ),
      )
    })
  }
}
