import { dualWithTrace, methodWithTrace } from '@effect/data/Debug'
import { interrupt } from '@effect/io/Cause'
import * as ExecutionStrategy from '@effect/io/ExecutionStrategy'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { asap } from '@typed/fx/internal/RefCounter'
import type { Chunk } from '@typed/fx/internal/_externals'
import { Effect, Exit, pipe, Scope, Either } from '@typed/fx/internal/_externals'
import { map } from '@typed/fx/internal/operator/map'
import { tap } from '@typed/fx/internal/operator/tap'

export const raceAll: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX,
) => Fx<Fx.ResourcesOf<FX[number]>, Fx.ErrorsOf<FX[number]>, Fx.OutputOf<FX[number]>> =
  methodWithTrace(
    (trace) =>
      <const FX extends ReadonlyArray<Fx<any, any, any>>>(
        fx: FX,
      ): Fx<Fx.ResourcesOf<FX[number]>, Fx.ErrorsOf<FX[number]>, Fx.OutputOf<FX[number]>> =>
        new RaceAllFx(fx).traced(trace),
  )

export const race: {
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, raced: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
  <R2, E2, B>(raced: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, raced: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B> =>
      raceAll([fx, raced]).traced(trace),
)

export const raceEither: {
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, raced: Fx<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    Either.Either<A, B>
  >

  <R2, E2, B>(raced: Fx<R2, E2, B>): <R, E, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, Either.Either<A, B>>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      fx: Fx<R, E, A>,
      raced: Fx<R2, E2, B>,
    ): Fx<R | R2, E | E2, Either.Either<A, B>> =>
      raceAll([map(fx, Either.left), map(raced, Either.right)]).traced(trace),
)

export class RaceAllFx<FX extends ReadonlyArray<Fx<any, any, any>>> extends BaseFx<
  Fx.ResourcesOf<FX[number]>,
  Fx.ErrorsOf<FX[number]>,
  Fx.OutputOf<FX[number]>
> {
  readonly name = 'RaceAll' as const

  constructor(readonly fx: FX) {
    super()
  }

  run(
    sink: Sink<Fx.ErrorsOf<FX[number]>, Fx.OutputOf<FX[number]>>,
  ): Effect.Effect<Fx.ResourcesOf<FX[number]> | Scope.Scope, never, unknown> {
    const { fx } = this

    if (fx.length === 0) {
      return sink.end()
    }

    return Effect.gen(function* ($) {
      const fiberId = yield* $(Effect.fiberId())
      const scope = yield* $(Effect.scope())

      let clean = false

      const scopes: Chunk.Chunk<Scope.CloseableScope> = yield* $(
        Effect.forEachWithIndex(fx, (s, i) =>
          pipe(
            Scope.fork(scope, ExecutionStrategy.sequential),
            Effect.flatMap((scope) =>
              pipe(
                s,
                tap(() => (clean ? Effect.unit() : cleanupScopes(i))),
                (x) => x.run(sink),
                Effect.scheduleForked(asap), // Schedule starts so that all Scopes can be returned *before* attempting to cleanup
                Effect.as(scope),
                Effect.provideService(Scope.Scope, scope),
              ),
            ),
          ),
        ),
      )

      function cleanupScopes(i: number) {
        return Effect.gen(function* ($) {
          clean = true

          const currentFibers = Array.from(scopes)

          currentFibers.splice(i, 1)

          yield* $(
            Effect.forEachDiscard(currentFibers, (s) =>
              Scope.close(s, Exit.failCause(interrupt(fiberId))),
            ),
          )
        })
      }
    })
  }
}
