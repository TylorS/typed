import { Arity1 } from '@typed/fp/common/exports'
import { pipe } from 'fp-ts/function'

import { Is, IsNot } from './is'
import { negate } from './negate'

/**
 * Wrap a function in a negation
 * @param :: (a -> b)
 * @returns :: (a -> boolean)
 */
export const complement: {
  <A>(fn: Is<A>): IsNot<A>
  <A>(fn: IsNot<A>): Is<A>
  <A, B>(fn: Arity1<A, B>): Arity1<A, boolean>
} = <A, B>(fn: Arity1<A, B>) => pipe(fn, negate) as any
