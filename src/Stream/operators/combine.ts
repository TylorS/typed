import { pipe } from 'fp-ts/function'

import { Disposable, disposeAll, settable } from '@/Disposable'
import { fromIO, fromPromise } from '@/Fiber/Instruction'
import { chain, Fx, Of } from '@/Fx'
import { decrementAndGet, make, MutableRef } from '@/MutableRef'

import { OutputOf, RequirementsOf, Sink, Stream } from '../Stream'

export function combine<R2, B>(right: Stream<R2, B>) {
  return <R, A>(left: Stream<R, A>): Stream<R & R2, readonly [A, B]> => combineAll(left, right)
}

export function combineAll<Streams extends ReadonlyArray<Stream<any, any>>>(
  ...streams: Streams
): Stream<CombineRequirements<Streams>, { readonly [K in keyof Streams]: OutputOf<Streams[K]> }> {
  return {
    run: (sink, params) => {
      const latest: any[] = Array(streams.length)
      const remaining = make<number>(streams.length)
      const running = make<number>(streams.length)
      const disposable = settable()

      disposable.add(
        disposeAll(
          ...streams.map((s, i) =>
            s.run(
              new CombineSink(
                sink,
                (a: any) =>
                  Fx(function* () {
                    latest[i] = a

                    if (remaining.get() === 0) {
                      yield* sink.event(
                        latest as any as { readonly [K in keyof Streams]: OutputOf<Streams[K]> },
                      )
                    }
                  }),
                remaining,
                running,
                disposable,
              ),
              params,
            ),
          ),
        ),
      )

      return disposable
    },
  }
}

class CombineSink<A> implements Sink<A> {
  private hasRun = false

  constructor(
    readonly sink: Sink<any>,
    readonly onEvent: (a: A) => Of<void>,
    readonly remaining: MutableRef<number>,
    readonly running: MutableRef<number>,
    readonly disposable: Disposable,
  ) {}

  event = (a: A): Of<void> =>
    pipe(
      fromIO(() => this),
      chain((self) =>
        Fx(function* () {
          if (!self.hasRun) {
            self.hasRun = true
            decrementAndGet(self.remaining)
          }

          return yield* self.onEvent(a)
        }),
      ),
    )

  error = (e: unknown): Of<void> => {
    const { sink, disposable } = this

    return Fx(function* () {
      yield* fromPromise(async () => await disposable.dispose())

      return yield* sink.error(e)
    })
  }

  end: Of<void> = pipe(
    fromIO(() => this),
    chain(({ sink, disposable, running }) =>
      Fx(function* () {
        if (decrementAndGet(running) === 0) {
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
