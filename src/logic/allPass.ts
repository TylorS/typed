import { curry } from '@typed/fp/lambda/exports'
import { Predicate } from 'fp-ts/function'

import { negate } from './negate'

/**
 * Returns true if value matches a list of predicates.
 * @param predicates [(a -> boolean)]
 * @param value a
 * @returns boolean
 */
export const allPass: {
  <A>(predicates: ReadonlyArray<Predicate<A>>, value: A): boolean
  <A>(predicates: ReadonlyArray<Predicate<A>>): Predicate<A>
} = curry(__allPass) as {
  <A>(predicates: ReadonlyArray<Predicate<A>>, value: A): boolean
  <A>(predicates: ReadonlyArray<Predicate<A>>): Predicate<A>
}

function __allPass<A>(predicates: ReadonlyArray<Predicate<A>>, value: A): boolean {
  const predicateCount = predicates.length

  for (let i = 0; i < predicateCount; ++i) {
    if (negate(predicates[i](value))) {
      return false
    }
  }

  return true
}
