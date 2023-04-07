import { dualWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'
import type { Scope } from '@effect/io/Scope'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { withRefCounter } from '@typed/fx/internal/RefCounter'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import type { Context, Fiber } from '@typed/fx/internal/externals'
import { Effect, Synchronized as Ref } from '@typed/fx/internal/externals'

export const exhaustMapLatest: {
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> =>
      new ExhaustMapLatestFx(fx, f).traced(trace),
)

export const exhaustLatest = <R, E, R2, E2, A>(
  fx: Fx<R, E, Fx<R2, E2, A>>,
): Fx<R | R2, E | E2, A> => exhaustMapLatest(fx, (a) => a)

export const exhaustMapLatestEffect: {
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
      exhaustMapLatest(fx, (a) => fromEffect(f(a))).traced(trace),
)

export class ExhaustMapLatestFx<R, E, A, R2, E2, B> extends BaseFx<R | R2, E | E2, B> {
  readonly name = 'ExhaustMapLatest' as const

  constructor(readonly fx: Fx<R, E, A>, readonly f: (a: A) => Fx<R2, E2, B>) {
    super()
  }

  run(sink: Sink<E | E2, B>): Effect.Effect<R | R2 | Scope, never, unknown> {
    return Effect.contextWithEffect((ctx: Context.Context<R | R2 | Scope>) =>
      pipe(
        Ref.make<Fiber.RuntimeFiber<never, unknown> | null>(null),
        Effect.zip(Ref.make<Fx<R2, E2, B> | null>(null)),
        Effect.flatMap(([fiberRef, nextFxRef]) => {
          return withRefCounter(
            1,
            (counter) => {
              const resetRef = pipe(fiberRef, Ref.set<Fiber.Fiber<never, unknown> | null>(null))

              const runNextFx: Effect.Effect<R2 | Scope, never, void> = pipe(
                nextFxRef,
                Ref.getAndSet<Fx<R2, E2, B> | null>(null),
                Effect.flatMap((fx) =>
                  fx
                    ? pipe(
                        fiberRef,
                        Ref.updateEffect(() => runFx(fx)),
                      )
                    : counter.decrement,
                ),
              )

              const runFx = (
                fx: Fx<R2, E2, B>,
              ): Effect.Effect<R2 | Scope, never, Fiber.RuntimeFiber<never, unknown> | null> =>
                pipe(
                  counter.refCounted(fx, sink, () => resetRef),
                  Effect.zipLeft(runNextFx),
                  Effect.forkScoped,
                )

              return this.fx.run(
                Sink(
                  (a) =>
                    pipe(
                      fiberRef,
                      Ref.updateEffect((fiber) =>
                        fiber
                          ? pipe(
                              nextFxRef,
                              Ref.set<Fx<R2, E2, B> | null>(this.f(a)),
                              Effect.as(fiber),
                            )
                          : pipe(
                              counter.increment,
                              Effect.flatMap(() => runFx(this.f(a))),
                            ),
                      ),
                      Effect.provideContext(ctx),
                    ),
                  sink.error,
                  () => Effect.provideContext(counter.decrement, ctx),
                ),
              )
            },
            sink.end,
          )
        }),
      ),
    )
  }
}
