import { dualWithTrace, methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { withRefCounter } from '@typed/fx/internal/RefCounter'
import { succeed } from '@typed/fx/internal/constructor/succeed'
import { Scope } from '@typed/fx/internal/externals'

export const combineAll: <const F extends ReadonlyArray<Fx<any, any, any>>>(
  fx: F,
) => Fx<
  Fx.ResourcesOf<F[number]>,
  Fx.ErrorsOf<F[number]>,
  { readonly [K in keyof F]: Fx.OutputOf<F[K]> }
> = methodWithTrace(
  (trace) =>
    <const F extends ReadonlyArray<Fx<any, any, any>>>(
      fx: F,
    ): Fx<
      Fx.ResourcesOf<F[number]>,
      Fx.ErrorsOf<F[number]>,
      { readonly [K in keyof F]: Fx.OutputOf<F[K]> }
    > =>
      fx.length === 0 ? succeed([] as any).traced(trace) : new CombineAllFx(fx).traced(trace),
)

export const combine: {
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, that: Fx<R2, E2, B>): Fx<R | R2, E | E2, readonly [A, B]>
  <R2, E2, B>(that: Fx<R2, E2, B>): <R, E, A>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, readonly [A, B]>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(self: Fx<R, E, A>, that: Fx<R2, E2, B>) =>
      combineAll([self, that]).traced(trace),
)

export class CombineAllFx<F extends ReadonlyArray<Fx<any, any, any>>> extends BaseFx<
  Fx.ResourcesOf<F[number]>,
  Fx.ErrorsOf<F[number]>,
  { readonly [K in keyof F]: Fx.OutputOf<F[K]> }
> {
  readonly name = 'CombineAll' as const

  constructor(readonly fx: F) {
    super()
  }

  run(
    sink: Sink<Fx.ErrorsOf<F[number]>, { readonly [K in keyof F]: Fx.OutputOf<F[K]> }>,
  ): Effect.Effect<Fx.ResourcesOf<F[number]>, never, unknown> {
    const fx = Array.from(this.fx)
    const length = fx.length

    return withRefCounter(
      length,
      (counter, scope) =>
        Effect.gen(function* ($) {
          const values = Array(length)
          let remaining = length

          for (let i = 0; i < length; i++) {
            yield* $(
              Effect.forkScoped(
                fx[i].run(
                  Sink(
                    (a) =>
                      Effect.suspend(() => {
                        if (!(i in values)) {
                          remaining--
                        }

                        values[i] = a

                        if (remaining === 0) {
                          return sink.event(values.slice(0) as Fx.OutputOf<CombineAllFx<F>>)
                        }

                        return Effect.unit()
                      }),
                    sink.error,
                    () => Effect.provideService(counter.decrement, Scope.Scope, scope),
                  ),
                ),
              ),
            )
          }
        }),
      sink.end,
    )
  }
}
