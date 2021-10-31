import { flow } from 'fp-ts/function'

import { Disposable } from '@/Disposable'

import { RunParams, Sink, Stream } from '../Stream'

export const map =
  <A, B>(f: (a: A) => B) =>
  <R>(stream: Stream<R, A>): Stream<R, B> =>
    Map.create(stream, f)

export class Map<R, A, B> implements Stream<R, B> {
  constructor(readonly source: Stream<R, A>, readonly f: (a: A) => B) {}

  run(sink: Sink<B>, params: RunParams<R>): Disposable {
    const { source, f } = this

    return source.run({ ...sink, event: flow(f, sink.event) }, params)
  }

  static create = <R, A, B>(stream: Stream<R, A>, f: (a: A) => B): Map<R, A, B> => {
    // Functor fusion
    if (stream instanceof Map) {
      return new Map(stream.source, flow(stream.f, f))
    }

    return new Map(stream, f)
  }
}
