import * as Chunk from '@effect/data/Chunk'
import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { withRefCounter } from '@typed/fx/internal/RefCounter'
import { Scope } from '@typed/fx/internal/externals'

export const collectAll: <R, E, A>(fx: Iterable<Fx<R, E, A>>) => Fx<R, E, Chunk.Chunk<A>> =
  methodWithTrace(
    (trace) =>
      <R, E, A>(fx: Iterable<Fx<R, E, A>>) =>
        new CollectAllFx(fx).traced(trace),
  )

export class CollectAllFx<R, E, A> extends BaseFx<R, E, Chunk.Chunk<A>> {
  readonly name = 'CollectAll' as const

  constructor(readonly fx: Iterable<Fx<R, E, A>>) {
    super()
  }

  run(sink: Sink<E, Chunk.Chunk<A>>) {
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
                          return sink.event(Chunk.unsafeFromArray(values.slice(0)))
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
