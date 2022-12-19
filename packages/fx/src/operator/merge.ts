import * as Effect from '@effect/io/Effect'
import { Scope } from '@effect/io/Scope'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { withRefCounter } from '../_internal/RefCounter.js'

export function mergeAll<Streams extends readonly Fx<any, any, any>[]>(
  ...streams: Streams
): Fx<Fx.ResourcesOf<Streams[number]>, Fx.ErrorsOf<Streams[number]>, Fx.OutputOf<Streams[number]>> {
  return new MergeAllFx(streams)
}

export function merge<R2, E2, B>(second: Fx<R2, E2, B>) {
  return <R, E, A>(first: Fx<R, E, A>): Fx<R | R2, E | E2, A | B> => new MergeAllFx([first, second])
}

export class MergeAllFx<Streams extends readonly Fx<any, any, any>[]>
  extends Fx.Variance<
    Fx.ResourcesOf<Streams[number]>,
    Fx.ErrorsOf<Streams[number]>,
    Fx.OutputOf<Streams[number]>
  >
  implements
    Fx<Fx.ResourcesOf<Streams[number]>, Fx.ErrorsOf<Streams[number]>, Fx.OutputOf<Streams[number]>>
{
  constructor(readonly streams: Streams) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, Fx.ErrorsOf<Streams[number]>, Fx.OutputOf<Streams[number]>>) {
    return withRefCounter(
      this.streams.length,
      (counter) =>
        pipe(
          this.streams,
          Effect.forEachPar((s) =>
            s.run(
              Fx.Sink<R2 | Scope, Fx.ErrorsOf<Streams[number]>, Fx.OutputOf<Streams[number]>>(
                sink.event,
                sink.error,
                counter.decrement,
              ),
            ),
          ),
        ),
      sink.end,
    )
  }
}
