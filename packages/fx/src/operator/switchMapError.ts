import * as Cause from '@effect/io/Cause'
import type * as Effect from '@effect/io/Effect'
import { match } from '@fp-ts/data/Either'
import { flow, pipe } from '@fp-ts/data/Function'

import type { Fx } from '../Fx.js'
import { failCause } from '../constructor/failCause.js'
import { fromEffect } from '../constructor/fromEffect.js'

import { switchMapCause } from './switchMapCause.js'

export function switchMapError<E, R2, E2, B>(f: (error: E) => Fx<R2, E2, B>) {
  return <R, A>(fx: Fx<R, E, A>): Fx<R | R2, E2, A | B> =>
    pipe(
      fx,
      switchMapCause((cause) => pipe(cause, Cause.failureOrCause, match(f, failCause))),
    )
}

export function switchMapErrorEffect<E, R2, E2, B>(f: (error: E) => Effect.Effect<R2, E2, B>) {
  return <R, A>(fx: Fx<R, E, A>): Fx<R | R2, E2, A | B> =>
    pipe(fx, switchMapError(flow(f, fromEffect)))
}
