import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import { match } from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'

import type { Fx } from '../Fx.js'

import { tapCause } from './tapCause.js'

export function tapError<E, R2, E2, B>(f: (error: E) => Effect.Effect<R2, E2, B>) {
  return <R, A>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A | B> =>
    pipe(
      fx,
      tapCause((cause) => pipe(cause, Cause.failureOrCause, match(f, Effect.failCause))),
    )
}
