import * as Effect from '@effect/io/Effect'

import { Fx } from './Fx.js'

export function fromIterable<A>(iterable: Iterable<A>): Fx<never, never, A> {
  return Fx((sink) =>
    Effect.suspend(() => {
      const iterator = iterable[Symbol.iterator]()
      let result = iterator.next()

      if (result.done) {
        return Effect.unit()
      }

      let eff = sink.event(result.value)
      result = iterator.next()

      while (!result.done) {
        const value = result.value
        eff = Effect.flatMap(eff, () => sink.event(value))
        result = iterator.next()
      }

      return eff
    }),
  )
}
