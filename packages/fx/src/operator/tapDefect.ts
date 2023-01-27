import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { match } from '@fp-ts/core/Option'

import type { Fx } from '../Fx.js'

import { tapCause } from './tapCause.js'

export function tapDefect<R2, E2, B>(f: (defect: unknown) => Effect.Effect<R2, E2, B>) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A | B> =>
    pipe(
      fx,
      tapCause(
        (cause): Effect.Effect<R2, E | E2, B> =>
          pipe(
            Cause.defects(cause).get(0),
            match(() => Effect.failCause(cause), f),
          ),
      ),
    )
}
