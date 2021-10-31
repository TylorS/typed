import { relative } from '@/Context'
import { Disposable, settable } from '@/Disposable'
import { fromPromise } from '@/Fiber/Instruction'
import { Fx } from '@/Fx'

import { RunParams, Sink, Stream } from '../Stream'

export function exhaust<R, R2, A>(stream: Stream<R, Stream<R2, A>>): Stream<R & R2, A> {
  return new MergeConcurrently(stream)
}

class MergeConcurrently<R, R2, A> implements Stream<R & R2, A> {
  constructor(readonly stream: Stream<R, Stream<R2, A>>) {}

  run(sink: Sink<A>, params: RunParams<R & R2>): Disposable {
    const disposable = settable()

    let running = false
    let ended = false
    let queued: Stream<R2, A> | null = null

    const innerSink: Sink<A> = {
      event: sink.event,
      error: (e) =>
        Fx(function* () {
          yield* fromPromise(async () => await disposable.dispose())

          yield* sink.error(e)
        }),
      end: Fx(function* () {
        yield* fromPromise(async () => await disposable.dispose())

        running = false

        if (queued !== null) {
          running = true
          disposable.add(queued.run(innerSink, params))

          return
        }

        if (ended) {
          yield* sink.end
        }
      }),
    }

    disposable.add(
      this.stream.run(
        {
          event: (stream) =>
            Fx(function* () {
              if (running) {
                queued = stream
              } else {
                running = true

                disposable.add(
                  stream.run(innerSink, {
                    ...params,
                    // Provide "inner" streams with relative time
                    context: relative(params.context),
                  }),
                )
              }
            }),
          error: innerSink.error,
          end: Fx(function* () {
            ended = true
          }),
        },
        params,
      ),
    )

    return disposable
  }
}
