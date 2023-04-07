import { dualWithTrace, methodWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { withRefCounter } from '@typed/fx/internal/RefCounter'
import { Scope } from '@typed/fx/internal/externals'

export const mergeAll: <const Streams extends ReadonlyArray<Fx<any, any, any>>>(
  ...streams: Streams
) => Fx<
  Fx.ResourcesOf<Streams[number]>,
  Fx.ErrorsOf<Streams[number]>,
  Fx.OutputOf<Streams[number]>
> = methodWithTrace(
  (trace) =>
    <Streams extends ReadonlyArray<Fx<any, any, any>>>(...streams: Streams) =>
      new MergeAllFx(streams).traced(trace),
)

export const merge: {
  <R, E, A, R2, E2, B>(first: Fx<R, E, A>, second: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
  <R2, E2, B>(second: Fx<R2, E2, B>): <R, E, A>(first: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(first: Fx<R, E, A>, second: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B> =>
      mergeAll(first, second).traced(trace),
)

export class MergeAllFx<Streams extends ReadonlyArray<Fx<any, any, any>>> extends BaseFx<
  Fx.ResourcesOf<Streams[number]>,
  Fx.ErrorsOf<Streams[number]>,
  Fx.OutputOf<Streams[number]>
> {
  readonly name = 'MergeAll' as const

  constructor(readonly streams: Streams) {
    super()
  }

  run(
    sink: Sink<Fx.ErrorsOf<Streams[number]>, Fx.OutputOf<Streams[number]>>,
  ): Effect.Effect<Fx.ResourcesOf<Streams[number]> | Scope.Scope, never, unknown> {
    return withRefCounter(
      this.streams.length,
      (counter, scope) => {
        const end = Effect.provideService(counter.decrement, Scope.Scope, scope)

        return pipe(
          this.streams,
          Effect.forEachParDiscard((s) =>
            s.run(
              Sink(
                sink.event,
                (cause) => Effect.zipLeft(sink.error(cause), end),
                () => end,
              ),
            ),
          ),
        )
      },
      sink.end,
    )
  }
}
