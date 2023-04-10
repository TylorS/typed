import type { Predicate } from '@effect/data/Predicate'
import { not } from '@effect/data/Predicate'

import { Fx, Sink } from './Fx.js'
import { Effect } from './externals.js'

export function skipWhile<R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A> {
  return Fx((sink) =>
    Effect.suspend(() => {
      let skipping = true

      return fx.run(
        Sink(
          (a) =>
            Effect.suspend(() => {
              if (skipping) {
                return predicate(a) ? Effect.unit() : sink.event(((skipping = false), a))
              }

              return sink.event(a)
            }),
          sink.error,
        ),
      )
    }),
  )
}

export function skipUntil<R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A> {
  return skipWhile(fx, not(predicate))
}
