import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from '../Fx.js'

export function fromIterable<A>(iterable: Iterable<A>): Fx<never, never, A> {
  return new FromIterableFx(iterable)
}

class FromIterableFx<A> extends Fx.Variance<never, never, A> implements Fx<never, never, A> {
  constructor(readonly iterable: Iterable<A>) {
    super()
  }

  run<R2>(sink: Sink<R2, never, A>) {
    const { iterable } = this

    return Effect.gen(function* ($) {
      const iterator = iterable[Symbol.iterator]()

      let result = iterator.next()
      while (!result.done) {
        yield* $(sink.event(result.value))
        result = iterator.next()
      }

      yield* $(sink.end)
    })
  }
}
