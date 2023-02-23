import { match } from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as Cause from '@effect/io/Cause'

import type { Fx } from '../Fx.js'
import { failCause } from '../constructor/failCause.js'

import { catchAllCause } from './catchAllCause.js'

export function catchAll<E, R2, E2, B>(f: (error: E) => Fx<R2, E2, B>) {
  return <R, A>(fx: Fx<R, E, A>): Fx<R | R2, E2, A | B> =>
    pipe(
      fx,
      catchAllCause((cause) => pipe(cause, Cause.failureOrCause, match(f, failCause))),
    )
}
