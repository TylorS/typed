import { curry } from '@typed/fp/lambda/exports'
import { Predicate } from 'fp-ts/function'

import { negate } from './negate'

/**
 * Returns true if all values in a list match a predicate, false otherwise.
 * @param predicate :: (a -> boolean)
 * @param list :: [a]
 * @returns :: boolean
 */
export const all: {
  <A>(predicate: Predicate<A>, value: ReadonlyArray<A>): boolean
  <A>(predicate: Predicate<A>): Predicate<ReadonlyArray<A>>
} = curry(__all)

function __all<A>(predicate: Predicate<A>, list: ReadonlyArray<A>): boolean {
  for (const value of list) {
    if (negate(predicate(value))) {
      return false
    }
  }

  return true
}
