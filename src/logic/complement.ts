import { Arity1 } from '@fp/common/exports'
import { pipe } from 'fp-ts/function'

import { negate } from './negate'
import { Is, IsNot } from './types'

/**
 * Wrap a function in a negation
 * @param (a -> b)
 * @returns (a -> boolean)
 */
export const complement: {
  <A>(fn: Is<A>): IsNot<A>
  <A>(fn: IsNot<A>): Is<A>
  <A, B>(fn: Arity1<A, B>): Arity1<A, boolean>
} = <A, B>(fn: Arity1<A, B>) => pipe(fn, negate) as any
