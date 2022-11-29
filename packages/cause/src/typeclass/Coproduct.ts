import { monoid } from '@fp-ts/core'
import * as C from '@fp-ts/core/typeclass/Coproduct'

import { Cause, Concurrent, Empty, Sequential } from '../Cause.js'

import { ConcurrentSemiCoproduct, SequentialSemiCoproduct } from './SemiCoproduct.js'
import { CauseTypeLambda } from './TypeLambda.js'

export const SequentialCoproduct: C.Coproduct<CauseTypeLambda> = {
  ...SequentialSemiCoproduct,
  zero: () => Empty,
  coproductAll: (causes) => Array.from(causes).reduce(Sequential, Empty),
}

export const getSequentialMonoid: <A>() => monoid.Monoid<Cause<A>> =
  C.getMonoid(SequentialCoproduct)

export const ConcurrentCoproduct: C.Coproduct<CauseTypeLambda> = {
  ...ConcurrentSemiCoproduct,
  zero: () => Empty,
  coproductAll: (causes) => Array.from(causes).reduce(Concurrent, Empty),
}

export const getConcurrentMonoid: <A>() => monoid.Monoid<Cause<A>> =
  C.getMonoid(ConcurrentCoproduct)
