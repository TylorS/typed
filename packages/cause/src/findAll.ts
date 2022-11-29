import { safeEval } from '@fp-ts/data'
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
    return safeEval.execute(findAllSafe(cause, predicate))
  }
}

export const findAllInterrupted = findAll(Cause.isInterrupted)
export const findAllUnexpected = findAll(Cause.isUnexpected)
export const findAllExpected = findAll(Cause.isExpected)

function findAllSafe<E>(
  cause: Cause.Cause<E>,
  predicate: Predicate<Cause.Cause.Simple<E>>,
): safeEval.SafeEval<ReadonlyArray<Cause.Cause.Simple<E>>> {
  return safeEval.gen(function* ($) {
    switch (cause._tag) {
      case 'Empty':
      case 'Interrupted':
      case 'Unexpected':
      case 'Expected':
        return predicate(cause) ? [cause] : []
      case 'Sequential':
      case 'Concurrent':
        return [
          ...(yield* $(findAllSafe(cause.left, predicate))),
          ...(yield* $(findAllSafe(cause.right, predicate))),
        ]
      case 'Traced':
      case 'Timed':
        return yield* $(findAllSafe(cause.cause, predicate))
    }
  })
}
