import { chainable } from '@fp-ts/core'

import { Cause } from '../Cause.js'

import { Covariant } from './Covariant.js'
import { FlatMap } from './FlatMap.js'
import { CauseTypeLambda } from './TypeLambda.js'

export const Chainable: chainable.Chainable<CauseTypeLambda> = {
  ...FlatMap,
  ...Covariant,
}

export const andThenDiscard: <_>(that: Cause<_>) => <A>(self: Cause<A>) => Cause<A> =
  chainable.andThenDiscard(Chainable)

export const bind: <N extends string, A extends object, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Cause<B>,
) => (self: Cause<A>) => Cause<{ readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> =
  chainable.bind(Chainable)

export const tap: <A, _>(f: (a: A) => Cause<_>) => (self: Cause<A>) => Cause<A> =
  chainable.tap(Chainable)
