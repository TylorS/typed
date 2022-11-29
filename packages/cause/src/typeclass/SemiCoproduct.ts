import { semigroup } from '@fp-ts/core'
import * as SC from '@fp-ts/core/typeclass/SemiCoproduct'

import { Cause, Concurrent, Sequential } from '../Cause.js'

import { Covariant } from './Covariant.js'
import { CauseTypeLambda } from './TypeLambda.js'

export const SequentialSemiCoproduct: SC.SemiCoproduct<CauseTypeLambda> = {
  coproduct: (that) => (self) => Sequential(self, that),
  coproductMany: (causes) => (self) => Array.from(causes).reduce(Sequential, self),
  imap: Covariant.imap,
}

const getSeq_ = SC.getSemigroup(SequentialSemiCoproduct)

export const getSequentialSemigroup = <A>(): semigroup.Semigroup<Cause<A>> => getSeq_()

export const ConcurrentSemiCoproduct: SC.SemiCoproduct<CauseTypeLambda> = {
  coproduct: (that) => (self) => Concurrent(self, that),
  coproductMany: (causes) => (self) => Array.from(causes).reduce(Concurrent, self),
  imap: Covariant.imap,
}

const getConc_ = SC.getSemigroup(ConcurrentSemiCoproduct)

export const getConcurrentSemigroup = <A>(): semigroup.Semigroup<Cause<A>> => getConc_()
