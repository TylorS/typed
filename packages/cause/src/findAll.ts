import { Predicate, Refinement } from '@fp-ts/data/Predicate'

import * as Cause from './Cause.js'

export function findAll<E, E2 extends Cause.Cause.Simple<E>>(
  refinment: Refinement<Cause.Cause.Simple<E>, E2>,
): (cause: Cause.Cause<E>) => ReadonlyArray<E2>

export function findAll<E>(
  predicate: Predicate<Cause.Cause.Simple<E>>,
): (cause: Cause.Cause<E>) => ReadonlyArray<Cause.Cause.Simple<E>>

export function findAll<E>(predicate: Predicate<Cause.Cause.Simple<E>>) {
  return function findAllCause(cause: Cause.Cause<E>): ReadonlyArray<Cause.Cause.Simple<E>> {
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

export const findAllInterrupted = findAll(Cause.isInterrupted)
export const findAllUnexpected = findAll(Cause.isUnexpected)
export const findAllExpected = findAll(Cause.isExpected)
