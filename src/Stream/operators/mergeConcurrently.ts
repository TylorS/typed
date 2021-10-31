import { relative } from '@/Context'
import { Disposable, settable } from '@/Disposable'
import { fromPromise } from '@/Fiber/Instruction'
import { Fx } from '@/Fx'

import { RunParams, Sink, Stream } from '../Stream'

export function mergeConcurrently(concurrency: number) {
  return <R, R2, A>(stream: Stream<R, Stream<R2, A>>): Stream<R & R2, A> =>
    new MergeConcurrently(stream, concurrency)
}

class MergeConcurrently<R, R2, A> implements Stream<R & R2, A> {
  constructor(readonly stream: Stream<R, Stream<R2, A>>, readonly concurrency: number) {}

  run(sink: Sink<A>, params: RunParams<R & R2>): Disposable {
    const { concurrency } = this
    const disposable = settable()

    let running = 0
    let ended = false
    let queue: Array<Stream<R2, A>> = []

    const innerSink: Sink<A> = {
      event: sink.event,
      error: (e) =>
        Fx(function* () {
          yield* fromPromise(async () => await disposable.dispose())

          yield* sink.error(e)
        }),
      end: Fx(function* () {
        yield* fromPromise(async () => await disposable.dispose())

        if (--running === 0 && ended) {
          return yield* sink.end
        }

        if (queue.length > 0) {
          const stream = queue.shift() as Stream<R2, A>

          running++
          disposable.add(stream.run(innerSink, params))
        }
      }),
    }

    disposable.add(
      this.stream.run(
        {
          event: (stream) =>
            Fx(function* () {
              if (running === concurrency) {
                queue.push(stream)
              } else {
                running++
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

    disposable.add({
      dispose: () => {
        queue = []
      },
    })

    return disposable
  }
}
