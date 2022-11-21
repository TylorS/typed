import { Predicate, Refinement } from '@fp-ts/data/Predicate'

import { Cause } from './Cause.js'

export function findAll<E, E2 extends Cause.Simple<E>>(
  refinment: Refinement<Cause.Simple<E>, E2>,
): (cause: Cause<E>) => ReadonlyArray<E2>

export function findAll<E>(
  predicate: Predicate<Cause.Simple<E>>,
): (cause: Cause<E>) => ReadonlyArray<Cause.Simple<E>>

export function findAll<E>(predicate: Predicate<Cause.Simple<E>>) {
  return function findAllCause(cause: Cause<E>): ReadonlyArray<Cause.Simple<E>> {
    switch (cause.tag) {
      case 'Empty':
      case 'Interrupted':
      case 'Unexpected':
      case 'Expected':
        return predicate(cause) ? [cause] : []
      case 'Sequential':
      case 'Concurrent':
        return [...findAllCause(cause.left), ...findAllCause(cause.right)]
      case 'Traced':
        return findAllCause(cause.cause)
    }
  }
}
