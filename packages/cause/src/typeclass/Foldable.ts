import { coproduct } from '@fp-ts/core'
import { Kind, TypeLambda } from '@fp-ts/core/HKT'
import * as F from '@fp-ts/core/typeclass/Foldable'
import { Monad } from '@fp-ts/core/typeclass/Monad'
import { Monoid } from '@fp-ts/core/typeclass/Monoid'

import { Cause } from '../Cause.js'
import { findAllExpected } from '../findAll.js'

import { CauseTypeLambda } from './TypeLambda.js'

export const reduce =
  <B, A>(b: B, f: (b: B, a: A) => B) =>
  (fa: Cause<A>): B => {
    const expected = findAllExpected(fa)

    return expected.length === 0 ? b : expected.reduce((b, e) => f(b, e.error), b)
  }

export const Foldable: F.Foldable<CauseTypeLambda> = {
  reduce,
}

export const foldMap: <M>(M: Monoid<M>) => <A>(f: (a: A) => M) => (self: Cause<A>) => M =
  F.foldMap(Foldable)

export const foldMapKind: <G extends TypeLambda>(
  G: coproduct.Coproduct<G>,
) => <A, R, O, E, B>(f: (a: A) => Kind<G, R, O, E, B>) => (self: Cause<A>) => Kind<G, R, O, E, B> =
  F.foldMapKind(Foldable)

export const reduceKind: <G extends TypeLambda>(
  G: Monad<G>,
) => <B, A, R, O, E>(
  b: B,
  f: (b: B, a: A) => Kind<G, R, O, E, B>,
) => (self: Cause<A>) => Kind<G, R, O, E, B> = F.reduceKind(Foldable)

export const reduceRight = F.reduceRight(Foldable)

export const reduceRightKind: <G extends TypeLambda>(
  G: Monad<G>,
) => <B, A, R, O, E>(
  b: B,
  f: (b: B, a: A) => Kind<G, R, O, E, B>,
) => (self: Cause<A>) => Kind<G, R, O, E, B> = F.reduceRightKind(Foldable)

export const toReadonlyArray = F.toReadonlyArray(Foldable)

export const toReadonlyArrayWith: <A, B>(f: (a: A) => B) => (self: Cause<A>) => readonly B[] =
  F.toReadonlyArrayWith(Foldable)
