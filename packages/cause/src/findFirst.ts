import { safeEval } from '@fp-ts/data'
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
    return safeEval.execute(findFirstSafe(cause, predicate))
  }
}

export const findInterrupted = findFirst(Cause.isInterrupted)
export const findUnexpected = findFirst(Cause.isUnexpected)
export const findExpected = findFirst(Cause.isExpected)

function findFirstSafe<E>(
  cause: Cause.Cause<E>,
  predicate: Predicate<Cause.Cause.Simple<E>>,
): safeEval.SafeEval<Option.Option<Cause.Cause.Simple<E>>> {
  return safeEval.gen(function* ($) {
    switch (cause._tag) {
      case 'Empty':
      case 'Interrupted':
      case 'Unexpected':
      case 'Expected':
        return predicate(cause) ? Option.some(cause) : Option.none
      case 'Sequential':
      case 'Concurrent': {
        const left = yield* $(findFirstSafe(cause.left, predicate))

        return Option.isSome(left) ? left : yield* $(findFirstSafe(cause.right, predicate))
      }
      case 'Traced':
      case 'Timed':
        return yield* $(findFirstSafe(cause.cause, predicate))
    }
  })
}
