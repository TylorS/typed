import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Either from '@fp-ts/core/Either'
import { flow, pipe } from '@fp-ts/core/Function'

import type { Fx } from '../Fx.js'

import { onDoneCause } from './onDoneCause.js'

export function onDone<E, R2, E2, B, A, R3, E3, C>(
  onCause: (cause: E) => Effect.Effect<R2, E2, B>,
  onDone: Effect.Effect<R3, E3, C>,
) {
  return <R>(fx: Fx<R, E, A>): Fx<R | R2 | R3, E | E2 | E3, A> =>
    pipe(
      fx,
      onDoneCause(flow(Cause.failureOrCause, Either.match(onCause, Effect.failCause)), onDone),
    )
}
