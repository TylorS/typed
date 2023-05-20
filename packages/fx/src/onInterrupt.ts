import type { HashSet } from '@effect/data/HashSet'
import * as Effect from '@effect/io/Effect'
import type { FiberId } from '@effect/io/Fiber/Id'

import { Fx } from './Fx.js'

export function onInterrupt<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (interruptors: HashSet<FiberId>) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, A> {
  return Fx((sink) =>
    Effect.onInterrupt(fx.run(sink), (interruptors) =>
      Effect.catchAllCause(f(interruptors), sink.error),
    ),
  )
}
