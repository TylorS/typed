import { pipe } from '@fp-ts/data/Function'
import * as O from '@fp-ts/data/Option'

import { Cause } from './Cause.js'
import { findExpected } from './findFirst.js'

export function expectedOrCause<E, R, R2>(
  onExpected: (e: E) => R,
  onCause: (c: Cause<never>) => R2,
) {
  return (e: Cause<E>): R | R2 =>
    pipe(
      findExpected(e),
      O.match(
        () => onCause(e as Cause<never>),
        (expected) => onExpected(expected.error),
      ),
    )
}
