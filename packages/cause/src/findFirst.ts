import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import { Predicate, Refinement } from '@fp-ts/data/Predicate'

import * as Cause from './Cause.js'

export function findFirst<E, E2 extends Cause.Cause.Simple<E>>(
  refinment: Refinement<Cause.Cause.Simple<E>, E2>,
): (cause: Cause.Cause<E>) => Option.Option<E2>

export function findFirst<E>(
  predicate: Predicate<Cause.Cause.Simple<E>>,
): (cause: Cause.Cause<E>) => Option.Option<Cause.Cause.Simple<E>>

export function findFirst<E>(predicate: Predicate<Cause.Cause.Simple<E>>) {
  return function findFirstCause(cause: Cause.Cause<E>): Option.Option<Cause.Cause.Simple<E>> {
    switch (cause._tag) {
      case 'Empty':
      case 'Interrupted':
      case 'Unexpected':
      case 'Expected':
        return predicate(cause) ? Option.some(cause) : Option.none
      case 'Sequential':
      case 'Concurrent':
        return pipe(
          findFirstCause(cause.left),
          Option.catchAll(() => findFirstCause(cause.right)),
        )
      case 'Traced':
        return findFirstCause(cause.cause)
    }
  }
}

export const findInterrupted = findFirst(Cause.isInterrupted)
export const findUnexpected = findFirst(Cause.isUnexpected)
export const findExpected = findFirst(Cause.isExpected)
