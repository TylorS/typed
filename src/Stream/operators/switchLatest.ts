import { relative } from '@/Context'
import { Disposable, disposeAll, disposeNone } from '@/Disposable'
import { fromPromise } from '@/Fiber/Instruction'
import { Fx } from '@/Fx'

import { RunParams, Sink, Stream } from '../Stream'

export function switchLatest<R, R2, A>(stream: Stream<R, Stream<R2, A>>): Stream<R & R2, A> {
  return new SwitchLatest(stream)
}

class SwitchLatest<R, R2, A> implements Stream<R & R2, A> {
  constructor(readonly stream: Stream<R, Stream<R2, A>>) {}

  run(sink: Sink<A>, params: RunParams<R & R2>): Disposable {
    let ended = false
    let current: Disposable = disposeNone

    const innerSink: Sink<A> = {
      event: sink.event,
      error: (e) =>
        Fx(function* () {
          yield* fromPromise(async () => await current.dispose())

          yield* sink.error(e)
        }),
      end: Fx(function* () {
        yield* fromPromise(async () => await current.dispose())

        if (ended) {
          return yield* sink.end
        }
      }),
    }

    return disposeAll(
      this.stream.run(
        {
          event: (stream) =>
            Fx(function* () {
              yield* fromPromise(async () => await current.dispose())

              current = stream.run(innerSink, {
                ...params,
                context: relative(params.context),
              })
            }),
          error: innerSink.error,
          end: Fx(function* () {
            ended = true
          }),
        },
        params,
      ),
      {
        dispose: () => current.dispose(),
      },
    )
  }
}
