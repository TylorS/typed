import { relative } from '@/Context'
import { Disposable, settable } from '@/Disposable'
import { fromPromise } from '@/Fiber/Instruction'
import { Fx } from '@/Fx'

import { RunParams, Sink, Stream } from '../Stream'

export function join<R, R2, A>(stream: Stream<R, Stream<R2, A>>): Stream<R & R2, A> {
  return new Join(stream)
}

class Join<R, R2, A> implements Stream<R & R2, A> {
  constructor(readonly stream: Stream<R, Stream<R2, A>>) {}

  run(sink: Sink<A>, params: RunParams<R & R2>): Disposable {
    const disposable = settable()

    let running = 0
    let ended = false

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
      }),
    }

    disposable.add(
      this.stream.run(
        {
          event: (stream) =>
            Fx(function* () {
              running++

              disposable.add(
                stream.run(innerSink, {
                  ...params,
                  // Provide "inner" streams with relative time
                  context: relative(params.context),
                }),
              )
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
