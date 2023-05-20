import { equals } from '@effect/data/Equal'
import * as Option from '@effect/data/Option'
import type { Equivalence } from '@effect/data/typeclass/Equivalence'
import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'

export function skipRepeatsWith<R, E, A>(fx: Fx<R, E, A>, eq: Equivalence<A>): Fx<R, E, A> {
  return Fx((sink) =>
    Effect.suspend(() => {
      let previous: Option.Option<A> = Option.none()
      const isPrevious = Option.contains(eq)

      return fx.run(
        Sink(
          (a) =>
            Effect.suspend(() =>
              isPrevious(previous, a)
                ? Effect.unit()
                : sink.event(((previous = Option.some(a)), a)),
            ),
          sink.error,
        ),
      )
    }),
  )
}

export function skipRepeats<R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> {
  return skipRepeatsWith(fx, equals)
}
