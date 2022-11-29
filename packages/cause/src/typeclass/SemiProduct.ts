import * as SP from '@fp-ts/core/typeclass/SemiProduct'
import { pipe } from '@fp-ts/data/Function'

import { Cause } from '../Cause.js'

import { Covariant, map } from './Covariant.js'
import { flatMap } from './FlatMap.js'
import { CauseTypeLambda } from './TypeLambda.js'

export const product: <B>(that: Cause<B>) => <A>(self: Cause<A>) => Cause<readonly [A, B]> =
  (that) => (self) =>
    pipe(
      self,
      flatMap((a) =>
        pipe(
          that,
          map((b) => [a, b]),
        ),
      ),
    )

export const SemiProduct: SP.SemiProduct<CauseTypeLambda> = {
  product,
  productMany: SP.productMany(Covariant, product),
  imap: Covariant.imap,
}

export const productMany: {
  <A extends ReadonlyArray<Cause<any>>>(collection: readonly [...A]): <B>(
    self: Cause<B>,
  ) => Cause<readonly [B, ...{ readonly [K in keyof A]: Cause.OutputOf<A[K]> }]>
  <A>(collection: Iterable<Cause<A>>): (self: Cause<A>) => Cause<readonly [A, ...A[]]>
} = SemiProduct.productMany

export const andThenBind: <N extends string, A extends object, B>(
  name: Exclude<N, keyof A>,
  that: Cause<B>,
) => (self: Cause<A>) => Cause<{ readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> =
  SP.andThenBind(SemiProduct)

export const nonEmptyStruct = SP.nonEmptyStruct(SemiProduct)

export const nonEmptyTuple = SP.nonEmptyTuple(SemiProduct) as <
  T extends readonly [Cause<any>, ...Cause<any>[]],
>(
  ...components: T
) => Cause<Readonly<{ [I in keyof T]: [T[I]] extends [Cause<infer A>] ? A : never }>>

export const productFlatten: <B>(
  that: Cause<B>,
) => <A extends readonly any[]>(self: Cause<A>) => Cause<readonly [...A, B]> =
  SP.productFlatten(SemiProduct)
