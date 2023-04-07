import { dualWithTrace } from '@effect/data/Debug'
import { identity, pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as RS from '@effect/io/Ref/Synchronized'
import type { Scope } from '@effect/io/Scope'

import { fromEffect } from '../conversion/fromEffect.js'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { withRefCounter } from '@typed/fx/internal/RefCounter'
import type { Context } from '@typed/fx/internal/externals'
import { Fiber } from '@typed/fx/internal/externals'

export const switchMap: {
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<
    Exclude<R, Scope> | Exclude<R2, Scope>,
    E | E2,
    B
  >

  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(
    fx: Fx<R, E, A>,
  ) => Fx<Exclude<R, Scope> | Exclude<R2, Scope>, E | E2, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>) =>
      new SwitchMapFx(fx, f).traced(trace),
)

export const switchLatest: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> =
  switchMap(identity)

export const switchMapEffect =
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) =>
  <R, E>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, B> =>
    new SwitchMapFx(fx, (a) => fromEffect(f(a)))

class SwitchMapFx<R, E, A, R2, E2, B> extends BaseFx<R | R2, E | E2, B> {
  readonly name = 'SwitchMap' as const

  constructor(readonly fx: Fx<R, E, A>, readonly f: (a: A) => Fx<R2, E2, B>) {
    super()
  }

  run(sink: Sink<E | E2, B>): Effect.Effect<R | R2 | Scope, never, unknown> {
    const { f, fx } = this

    return Effect.contextWithEffect((context: Context.Context<R | R2 | Scope>) =>
      withRefCounter(
        // Start with 1 to account for the outer Fx
        1,
        (counter) =>
          Effect.gen(function* ($) {
            const refFiber = yield* $(RS.make<Fiber.RuntimeFiber<never, unknown> | null>(null))
            const resetRef = RS.set<Fiber.RuntimeFiber<never, unknown> | null>(refFiber, null)

            return yield* $(
              fx.run(
                Sink(
                  (a) =>
                    RS.updateEffect(refFiber, (fiber) =>
                      Effect.flatMap(
                        fiber ? Fiber.interrupt(fiber) : Effect.asUnit(counter.increment),
                        () =>
                          pipe(
                            counter.refCounted(f(a), sink, () => resetRef),
                            Effect.forkScoped,
                            Effect.provideContext(context),
                          ),
                      ),
                    ),
                  sink.error,
                  () => Effect.provideContext(counter.decrement, context),
                ),
              ),
            )
          }),
        sink.end,
      ),
    )
  }
}
