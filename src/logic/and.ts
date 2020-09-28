import { curry } from '@typed/fp/lambda/exports'
import { Predicate } from 'fp-ts/function'

import { Is } from './is'

/**
 * Returns true if both predicates return true.
 * @param predicate1 :: (a -> boolean)
 * @param predicate2 :: (a -> boolean)
 * @param value :: a
 * @returns :: boolean
 */
export const and: {
  <A, B>(predicate1: Is<A>, predicate2: Is<B>, value: unknown): value is A & B
  <A, B>(predicate1: Is<A>, predicate2: Is<B>): (value: unknown) => value is A & B
  <A>(predicate1: Is<A>): {
    <B>(predicate2: Is<B>, value: unknown): value is A & B
    <B>(predicate2: Is<B>): (value: unknown) => value is A & B
  }

  <A>(predicate1: Predicate<A>, predicate2: Predicate<A>, value: A): boolean
  <A>(predicate1: Predicate<A>, predicate2: Predicate<A>): Predicate<A>
  <A>(predicate1: Predicate<A>): {
    (predicate2: Predicate<A>, value: A): boolean
    (predicate2: Predicate<A>): Predicate<A>
  }
} = curry(__and) as {
  <C, A extends C, B extends C>(predicate1: Is<A>, predicate2: Is<B>, value: C): value is A & B
  <C, A extends C, B extends C>(predicate1: Is<A>, predicate2: Is<B>): (value: C) => value is A & B
  <C, A extends C>(predicate1: Is<A>): {
    <B extends C>(predicate2: Is<B>, value: C): value is A & B
    <B extends C>(predicate2: Is<B>): (value: C) => value is A & B
  }

  <A>(predicate1: Predicate<A>, predicate2: Predicate<A>, value: A): boolean
  <A>(predicate1: Predicate<A>, predicate2: Predicate<A>): Predicate<A>
  <A>(predicate1: Predicate<A>): {
    (predicate2: Predicate<A>, value: A): boolean
    (predicate2: Predicate<A>): Predicate<A>
  }
}

function __and<A>(predicate1: Predicate<A>, predicate2: Predicate<A>, value: A): boolean {
  return predicate1(value) && predicate2(value)
}
