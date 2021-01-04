import { Arity1 } from '@fp/common/exports'
import { curry } from '@fp/lambda/exports'
import { pipe, Predicate } from 'fp-ts/function'
import { map as mapO, none, Option, some } from 'fp-ts/Option'

/**
 * Check if a value is a given type
 */
export type Is<A> = (value: unknown) => value is A

/**
 * Check that value is not a given type
 */
export type IsNot<A> = <B extends unknown>(value: A | B) => value is B

/**
 * A type for matching against a particular value.
 */
export interface Match<A, B> extends Arity1<A, Option<B>> {}

export namespace Match {
  /**
   * Map over a Match
   */
  export const map = curry(
    <A, B, C>(fn: (value: B) => C, match: Match<A, B>): Match<A, C> => (value: A) =>
      pipe(value, match, mapO(fn)),
  ) as {
    <A, B, C>(fn: (value: B) => C, match: Match<A, B>): Match<A, C>
    <B, C>(fn: (value: B) => C): <A>(match: Match<A, B>) => Match<A, C>
  }

  /**
   * Create a match from a predicate.
   */
  export function fromPredicate<A>(predicate: Predicate<A>): Match<A, A>
  export function fromPredicate<A, B>(predicate: Is<B>): Match<A, B>
  export function fromPredicate<A>(predicate: Predicate<A>): Match<A, A> {
    return (value: A) => (predicate(value) ? some(value) : none)
  }
}
