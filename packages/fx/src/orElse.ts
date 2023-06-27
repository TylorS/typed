import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

import { Fx } from './Fx.js'
import { observe } from './observe.js'

export function orElse<R, E, A, R2, E2, B>(
  self: Fx<R, E, A>,
  that: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return Fx((sink) =>
    Effect.catchAllCause(Effect.scoped(observe(self, sink.event)), (cause) =>
      that(cause).run(sink),
    ),
  )
}
