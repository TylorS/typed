import { curry } from '@fp/lambda/exports'
import { Refinement } from 'fp-ts/function'
import { none, Option, some } from 'fp-ts/Option'

/**
 * Basic pattern matching
 * @param conditionals [((a -> boolean), (a -> b))]
 * @param value a
 * @returns Maybe b
 */
export const cond = curry(__cond) as {
  <A extends ReadonlyArray<Conditional<I, any, any>>, I>(conditions: A, value: I): Option<
    ConditionalOutput<A[number]>
  >
  <A extends ReadonlyArray<Conditional<I, any, any>>, I>(conditions: A): (
    value: I,
  ) => Option<ConditionalOutput<A[number]>>

  create: <A, B extends A, C>(...args: Conditional<A, B, C>) => Conditional<A, B, C>
}

cond.create = <A, B extends A, C>(...args: Conditional<A, B, C>) => args

function __cond<A extends ReadonlyArray<Conditional<I, any, any>>, I>(
  conditionals: A,
  value: I,
): Option<ConditionalOutput<A[number]>> {
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
export type Conditional<A, B extends A, C> = [refinement: Refinement<A, B>, f: (value: B) => C]

export type ConditionalInput<A> = A extends Conditional<infer R, any, any> ? R : never
export type ConditionalRefinment<A> = A extends Conditional<any, infer R, any> ? R : never
export type ConditionalOutput<A> = A extends Conditional<any, any, infer R> ? R : never
