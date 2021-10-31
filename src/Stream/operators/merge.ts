import { pipe } from 'fp-ts/function'

import { Disposable, disposeAll, settable } from '@/Disposable'
import { fromIO, fromPromise } from '@/Fiber/Instruction'
import { chain, Fx, Of } from '@/Fx'
import { decrementAndGet, make, MutableRef } from '@/MutableRef'

import { OutputOf, RequirementsOf, Sink, Stream } from '../Stream'

export function merge<R2, B>(right: Stream<R2, B>) {
  return <R, A>(left: Stream<R, A>): Stream<R & R2, A | B> => mergeAll(left, right)
}

export function mergeAll<Streams extends ReadonlyArray<Stream<any, any>>>(
  ...streams: Streams
): Stream<CombineRequirements<Streams>, OutputOf<Streams[number]>> {
  return {
    run: (sink, params) => {
      const remaining = make<number>(streams.length)
      const disposable = settable()

      disposable.add(
        disposeAll(
          ...streams.map((s) => s.run(new MergeSink(sink, remaining, disposable), params)),
        ),
      )

      return disposable
    },
  }
}

class MergeSink<A> implements Sink<A> {
  constructor(
    readonly sink: Sink<any>,
    readonly remaining: MutableRef<number>,
    readonly disposable: Disposable,
  ) {}

  event = this.sink.event

  error = (e: unknown): Of<void> => {
    const { sink, disposable } = this

    return Fx(function* () {
      yield* fromPromise(async () => await disposable.dispose())

      return yield* sink.error(e)
    })
  }

  end: Of<void> = pipe(
    fromIO(() => this),
    chain(({ sink, disposable, remaining }) =>
      Fx(function* () {
        if (decrementAndGet(remaining) === 0) {
          yield* fromPromise(async () => await disposable.dispose())

          return yield* sink.end
        }
      }),
    ),
  )
}

type CombineRequirements<Streams extends ReadonlyArray<Stream<any, any>>> = ToIntersection<
  {
    [K in keyof Streams]: RequirementsOf<Streams[K]>
  }
>

type ToIntersection<A extends readonly any[], R = unknown> = A extends readonly [
  infer Head,
  ...infer Tail
]
  ? ToIntersection<Tail, R & Head>
  : R
