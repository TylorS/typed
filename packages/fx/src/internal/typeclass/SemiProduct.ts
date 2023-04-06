import * as SP from '@effect/data/typeclass/SemiProduct'

import type { Fx, FxTypeLambda } from '@typed/fx/internal/Fx'
import { flatMap, map } from '@typed/fx/internal/operator/index'
import { imap } from '@typed/fx/internal/typeclass/Covariant'

export const product: SP.SemiProduct<FxTypeLambda>['product'] = (self, that) =>
  flatMap(self, (a) => map(that, (b) => [a, b]))

export const SemiProduct: SP.SemiProduct<FxTypeLambda> = {
  product,
  productMany: SP.productMany<FxTypeLambda>(map, product),
  imap,
}

export const bindDiscard: {
  <N extends string, A extends object, R2, E2, B>(name: Exclude<N, keyof A>, that: Fx<R2, E2, B>): <
    R1,
    E1,
  >(
    self: Fx<R1, E1, A>,
  ) => Fx<R2 | R1, E2 | E1, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
  <R1, E1, A extends object, N extends string, O2, E2, B>(
    self: Fx<R1, E1, A>,
    name: Exclude<N, keyof A>,
    that: Fx<O2, E2, B>,
  ): Fx<R1 | O2, E1 | E2, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
} = SP.bindDiscard(SemiProduct)

export const appendElement: {
  <R2, E2, B>(that: Fx<R2, E2, B>): <R1, E1, const A extends ReadonlyArray<any>>(
    self: Fx<R1, E1, A>,
  ) => Fx<R2 | R1, E2 | E1, [...A, B]>
  <R1, E1, const A extends ReadonlyArray<any>, O2, E2, B>(
    self: Fx<R1, E1, A>,
    that: Fx<O2, E2, B>,
  ): Fx<R1 | O2, E1 | E2, [...A, B]>
} = SP.appendElement(SemiProduct)

export const nonEmptyStruct: <R extends Readonly<Record<string, Fx<any, any, any>>>>(
  fields: keyof R extends never ? never : R,
) => Fx<
  Fx.ResourcesOf<R[string]>,
  Fx.ErrorsOf<R[string]>,
  { readonly [K in keyof R]: Fx.OutputOf<R[K]> }
> = SP.nonEmptyStruct(SemiProduct) as any

export const nonEmptyTuple: <T extends readonly [Fx<any, any, any>, ...Array<Fx<any, any, any>>]>(
  ...elements: T
) => Fx<Fx.ResourcesOf<T[number]>, Fx.ErrorsOf<T[number]>, { [I in keyof T]: Fx.OutputOf<T[I]> }> =
  SP.nonEmptyTuple(SemiProduct) as any
