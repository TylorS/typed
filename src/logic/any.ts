import { curry } from '@fp/lambda/exports'
import { Predicate } from 'fp-ts/function'

/**
 * Returns true if any values in a list pass the given predicate.
 * @param predicate (a -> boolean)
 * @param list [a]
 * @returns boolean
 */
// tslint:disable-next-line:variable-name
export const any: {
  <A>(predicate: Predicate<A>, list: readonly A[]): boolean
  <A>(predicate: Predicate<A>): (list: readonly A[]) => boolean
} = curry(__any) as {
  <A>(predicate: Predicate<A>, list: readonly A[]): boolean
  <A>(predicate: Predicate<A>): (list: readonly A[]) => boolean
}

function __any<A>(predicate: Predicate<A>, list: readonly A[]): boolean {
  for (const value of list) {
    if (predicate(value)) {
      return true
    }
  }

  return false
}
