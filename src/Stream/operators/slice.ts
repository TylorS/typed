import { Disposable } from '@/Disposable'
import { fromValue } from '@/Fiber/Instruction'
import { Fx, Of } from '@/Fx'

import { RunParams, Sink, Stream } from '../Stream'

export const slice =
  (skip: number, take: number) =>
  <R, A>(stream: Stream<R, A>): Stream<R, A> =>
    new Slice(stream, skip, take)

export const skip = (n: number): (<R, A>(stream: Stream<R, A>) => Stream<R, A>) =>
  slice(n, Infinity)

export const take = (n: number): (<R, A>(stream: Stream<R, A>) => Stream<R, A>) => slice(0, n)

class Slice<R, A> implements Stream<R, A> {
  constructor(readonly stream: Stream<R, A>, readonly skip: number, readonly take: number) {}

  run(sink: Sink<A>, params: RunParams<R>): Disposable {
    return this.stream.run(new SliceSink(sink, this.skip, this.take), params)
  }
}

class SliceSink<A> implements Sink<A> {
  constructor(private readonly sink: Sink<A>, private skip: number, private take: number) {}

  event(a: A): Of<void> {
    if (--this.skip > 0) {
      return fromValue(undefined)
    }

    const { sink } = this
    const remaining = --this.take

    return Fx(function* () {
      yield* sink.event(a)

      if (remaining === 0) {
        return yield* sink.end
      }
    })
  }

  error = this.sink.error
  end = this.sink.end
}
