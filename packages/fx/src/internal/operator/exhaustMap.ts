import { dualWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { withRefCounter } from '@typed/fx/internal/RefCounter'
import { Effect, Synchronized } from '@typed/fx/internal/_externals'
import type { Context, Fiber, Scope } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const exhaustMap: {
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> =>
      new ExhaustMapFx(fx, f).traced(trace),
)

export const exhaust = <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>): Fx<R | R2, E | E2, A> =>
  exhaustMap(fx, (a) => a)

export const exhaustMapEffect: {
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    B
  >

  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      fx: Fx<R, E, A>,
      f: (a: A) => Effect.Effect<R2, E2, B>,
    ): Fx<R | R2, E | E2, B> =>
      exhaustMap(fx, (a) => fromEffect(f(a))).traced(trace),
)

export class ExhaustMapFx<R, E, A, R2, E2, B> extends BaseFx<R | R2, E | E2, B> {
  readonly name = 'ExhaustMap' as const

  constructor(readonly fx: Fx<R, E, A>, readonly f: (a: A) => Fx<R2, E2, B>) {
    super()
  }

  run(sink: Sink<E | E2, B>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    return Effect.contextWithEffect((ctx: Context.Context<R | R2 | Scope.Scope>) =>
      pipe(
        Synchronized.make<Fiber.Fiber<never, unknown> | null>(null),
        Effect.flatMap((fiberRef) => {
          const resetRef = pipe(
            fiberRef,
            Synchronized.set<Fiber.Fiber<never, unknown> | null>(null),
          )

          return withRefCounter(
            1,
            (counter) =>
              this.fx.run(
                Sink(
                  (a) =>
                    pipe(
                      fiberRef,
                      Synchronized.updateEffect((fiber) =>
                        fiber
                          ? Effect.succeed(fiber)
                          : pipe(
                              counter.increment,
                              Effect.flatMap(() =>
                                Effect.forkScoped(
                                  counter.refCounted(this.f(a), sink, () => resetRef),
                                ),
                              ),
                            ),
                      ),
                      Effect.provideContext(ctx),
                    ),
                  sink.error,
                  () => Effect.provideContext(counter.decrement, ctx),
                ),
              ),
            sink.end,
          )
        }),
      ),
    )
  }
}
