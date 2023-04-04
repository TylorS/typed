import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'
import { splitInterrupt } from '../_internal/matchInterruptCause.js'

export function zipAll<Streams extends readonly Fx<any, any, any>[]>(
  ...streams: Streams
): Fx<
  Fx.ResourcesOf<Streams[number]>,
  Fx.ErrorsOf<Streams[number]>,
  {
    readonly [K in keyof Streams]: Fx.OutputOf<Streams[K]>
  }
> {
  return new ZipAllFx(streams)
}

export function zip<R2, E2, B>(second: Fx<R2, E2, B>) {
  return <R, E, A>(first: Fx<R, E, A>): Fx<R | R2, E | E2, readonly [A, B]> => zipAll(first, second)
}

class ZipAllFx<Streams extends readonly Fx<any, any, any>[]>
  extends Fx.Variance<
    Fx.ResourcesOf<Streams[number]>,
    Fx.ErrorsOf<Streams[number]>,
    {
      readonly [K in keyof Streams]: Fx.OutputOf<Streams[K]>
    }
  >
  implements
    Fx<
      Fx.ResourcesOf<Streams[number]>,
      Fx.ErrorsOf<Streams[number]>,
      {
        readonly [K in keyof Streams]: Fx.OutputOf<Streams[K]>
      }
    >
{
  constructor(readonly streams: Streams) {
    super()
  }

  run<R2>(
    sink: Fx.Sink<
      R2,
      Fx.ErrorsOf<Streams[number]>,
      {
        readonly [K in keyof Streams]: Fx.OutputOf<Streams[K]>
      }
    >,
  ) {
    const l = this.streams.length

    return withRefCounter(
      l,
      (counter) => {
        const results = new Map<number, any>()

        const emitIfReady = Effect.gen(function* ($) {
          if (results.size !== l) {
            return
          }

          const output = Array.from({ length: l }, (_, i) => results.get(i)) as any

          results.clear()

          yield* $(sink.event(output))
        })

        return pipe(
          this.streams,
          Effect.forEachParWithIndex((s, i) =>
            s.run(
              Fx.Sink(
                (a) =>
                  pipe(
                    Effect.sync(() => results.set(i, a)),
                    Effect.zipRight(emitIfReady),
                  ),
                splitInterrupt(sink.error, () => counter.decrement),
                counter.decrement,
              ),
            ),
          ),
        )
      },
      sink.end,
    )
  }
}
