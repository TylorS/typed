import * as Effect from '@effect/io/Effect'

import { Fx } from './Fx.js'

export function fromArray<A>(array: ReadonlyArray<A>): Fx<never, never, A> {
  return Fx((sink) =>
    Effect.suspend(() => {
      if (array.length === 0) {
        return Effect.unit
      }

      let eff = sink.event(array[0])

      for (let i = 1; i < array.length; i++) {
        eff = Effect.flatMap(eff, () => sink.event(array[i]))
      }

      return eff
    }),
  )
}
