import * as Cause from '@effect/io/Cause'
import { pipe } from '@fp-ts/data/Function'
import { match } from '@fp-ts/data/Option'

import type { Fx } from '../Fx.js'
import { failCause } from '../constructor/failCause.js'

import { catchAllCause } from './catchAllCause.js'

export function catchAllDefect<R2, E2, B>(f: (defect: unknown) => Fx<R2, E2, B>) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A | B> =>
    pipe(
      fx,
      catchAllCause(
        (cause): Fx<R2, E | E2, B> =>
          pipe(
            Cause.defects(cause).get(0),
            match(() => failCause(cause), f),
          ),
      ),
    )
}
