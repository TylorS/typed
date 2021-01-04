import { curry } from '@fp/lambda/exports'
import { Predicate } from 'fp-ts/function'
import { none, Option, some } from 'fp-ts/Option'

/**
 * Basic pattern matching
 * @param conditionals [((a -> boolean), (a -> b))]
 * @param value a
 * @returns Maybe b
 */
export const cond: {
  <A, B>(conditions: ReadonlyArray<Conditional<A, B>>, value: A): Option<B>
  <A, B>(conditions: ReadonlyArray<Conditional<A, B>>): (value: A) => Option<B>
} = curry(__cond) as {
  <A, B>(conditions: ReadonlyArray<Conditional<A, B>>, value: A): Option<B>
  <A, B>(conditions: ReadonlyArray<Conditional<A, B>>): (value: A) => Option<B>
}

function __cond<A, B>(conditionals: ReadonlyArray<Conditional<A, B>>, value: A): Option<B> {
  const itemCount = conditionals.length

  for (let i = 0; i < itemCount; ++i) {
    const [predicate, f] = conditionals[i]

    if (predicate(value)) {
      return some(f(value))
    }
  }

  return none
}

/**


 */
export type Conditional<A, B> = [Predicate<A>, (value: A) => B]
