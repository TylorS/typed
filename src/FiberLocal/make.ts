import deepEquals from 'fast-deep-equal'
import { Eq } from 'fp-ts/Eq'
import { constant } from 'fp-ts/function'
import { Magma } from 'fp-ts/Magma'
import { Option, some } from 'fp-ts/Option'

import { Fx } from '@/Fx'

import { FiberLocal } from './FiberLocal'

const deepEqualsEq =
  <A>(r: A) =>
  (l: A) =>
    deepEquals(l, r)

export function make<R, A>(
  initial: Fx<R, A>,
  options: FiberLocalOptions<A> = {},
): FiberLocal<R, A> {
  return {
    initial,
    equals: options.equals ?? deepEqualsEq,
    concat: options.concat ?? constant,
    fork: options.fork ?? some,
  }
}

export interface FiberLocalOptions<A> extends Partial<Eq<A>>, Partial<Magma<A>> {
  readonly fork?: (a: A) => Option<A>
}
