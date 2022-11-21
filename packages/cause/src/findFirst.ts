import * as Option from '@fp-ts/data/Option'
import { Predicate, Refinement } from '@fp-ts/data/Predicate'

import { Cause } from './Cause.js'

export function findFirst<E, E2 extends Cause.Simple<E>>(
  refinment: Refinement<Cause.Simple<E>, E2>,
): (cause: Cause<E>) => Option.Option<E2>

export function findFirst<E>(
  predicate: Predicate<Cause.Simple<E>>,
): (cause: Cause<E>) => Option.Option<Cause.Simple<E>>

export function findFirst<E>(predicate: Predicate<Cause.Simple<E>>) {
  return function findFirstCause(cause: Cause<E>): Option.Option<Cause.Simple<E>> {
    switch (cause.tag) {
      case 'Empty':
      case 'Interrupted':
      case 'Unexpected':
      case 'Expected':
        return predicate(cause) ? Option.some(cause) : Option.none
      case 'Sequential':
      case 'Concurrent': {
        const l = findFirstCause(cause.left)

        return Option.isSome(l) ? l : findFirstCause(cause.right)
      }
      case 'Traced':
        return findFirstCause(cause.cause)
    }
  }
}
