import { pipe } from '@effect/data/Function'
import type * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'

import type { Fx } from '../Fx.js'

import { onDoneCause } from './onDoneCause.js'

export function onExit<E, R2, E2, B>(
  onExit: (exit: Exit.Exit<E, void>) => Effect.Effect<R2, E2, B>,
) {
  return <R, A>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A> =>
    pipe(
      fx,
      onDoneCause((cause) => onExit(Exit.failCause(cause)), onExit(Exit.unit())),
    )
}
