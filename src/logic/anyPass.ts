import { curry } from '@fp/lambda/exports'
import { Predicate } from 'fp-ts/function'

/**
 * Returns true if value matches any predicates
 * @param predicates [(a -> boolean)]
 * @param value a
 * @returns boolean
 */
export const anyPass: {
  <A>(predicates: ReadonlyArray<Predicate<A>>, value: A): boolean
  <A>(predicates: ReadonlyArray<Predicate<A>>): (value: A) => boolean
} = curry(__anyPass) as {
  <A>(predicates: ReadonlyArray<Predicate<A>>, value: A): boolean
  <A>(predicates: ReadonlyArray<Predicate<A>>): (value: A) => boolean
}

function __anyPass<A>(predicates: ReadonlyArray<Predicate<A>>, value: A): boolean {
  for (const predicate of predicates) {
    if (predicate(value)) {
      return true
    }
  }

  return false
}
