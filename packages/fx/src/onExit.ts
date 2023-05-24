import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'

import { Fx } from './Fx.js'

export function onExit<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (exit: Exit.Exit<E, void>) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, A> {
  return Fx((sink) =>
    Effect.onExit(fx.run(sink), (exit) => Effect.catchAllCause(f(exit), sink.error)),
  )
}
