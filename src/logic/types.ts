import { Arity1 } from '@typed/fp/common/exports'
import { curry } from '@typed/fp/lambda/exports'
import { pipe, Predicate } from 'fp-ts/function'
import * as O from 'fp-ts/Option'

import { Is } from './is'

export interface Match<A, B> extends Arity1<A, O.Option<B>> {}

export namespace Match {
  export const map = curry(
    <A, B, C>(fn: (value: B) => C, match: Match<A, B>): Match<A, C> => (value: A) =>
      pipe(value, match, O.map(fn)),
  ) as {
    <A, B, C>(fn: (value: B) => C, match: Match<A, B>): Match<A, C>
    <B, C>(fn: (value: B) => C): <A>(match: Match<A, B>) => Match<A, C>
  }

  export function fromPredicate<A>(predicate: Predicate<A>): Match<A, A>
  export function fromPredicate<A, B>(predicate: Is<B>): Match<A, B>
  export function fromPredicate<A>(predicate: Predicate<A>): Match<A, A> {
    return (value: A) => (predicate(value) ? O.some(value) : O.none)
  }
}
