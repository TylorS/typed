import { semigroup } from '@fp-ts/core'
import * as SA from '@fp-ts/core/typeclass/SemiApplicative'

import { Cause } from '../Cause.js'

import { Covariant } from './Covariant.js'
import { SemiProduct } from './SemiProduct.js'
import { CauseTypeLambda } from './TypeLambda.js'

export const SemiApplicative: SA.SemiApplicative<CauseTypeLambda> = {
  ...SemiProduct,
  ...Covariant,
}

export const ap: <A>(fa: Cause<A>) => <B>(self: Cause<(a: A) => B>) => Cause<B> =
  SA.ap(SemiApplicative)

export const lift2: <A, B, C>(f: (a: A, b: B) => C) => (fa: Cause<A>, fb: Cause<B>) => Cause<C> =
  SA.lift2(SemiApplicative)

export const lift3: <A, B, C, D>(
  f: (a: A, b: B, c: C) => D,
) => (fa: Cause<A>, fb: Cause<B>, fc: Cause<C>) => Cause<D> = SA.lift3(SemiApplicative)

export const liftSemigroup: <A>(S: semigroup.Semigroup<A>) => semigroup.Semigroup<Cause<A>> =
  SA.liftSemigroup(SemiApplicative)
