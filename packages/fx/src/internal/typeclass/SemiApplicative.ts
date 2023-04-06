import * as SA from '@effect/data/typeclass/SemiApplicative'
import type { Semigroup } from '@effect/data/typeclass/Semigroup'

import type { Fx, FxTypeLambda } from '@typed/fx/internal/Fx'
import { Covariant } from '@typed/fx/internal/typeclass/Covariant'
import { SemiProduct } from '@typed/fx/internal/typeclass/SemiProduct'

export const SemiApplicative: SA.SemiApplicative<FxTypeLambda> = {
  ...SemiProduct,
  ...Covariant,
}

export const ap: {
  <R2, E2, A>(that: Fx<R2, E2, A>): <R1, E1, B>(
    self: Fx<R1, E1, (a: A) => B>,
  ) => Fx<R2 | R1, E2 | E1, B>
  <R1, E1, A, B, R2, E2>(self: Fx<R1, E1, (a: A) => B>, that: Fx<R2, E2, A>): Fx<
    R1 | R2,
    E1 | E2,
    B
  >
} = SA.ap(SemiApplicative)

export const getSemigroup: <R, E, A>(S: Semigroup<A>) => Semigroup<Fx<R, E, A>> =
  SA.getSemigroup(SemiApplicative)

export const lift2: <A, B, C>(
  f: (a: A, b: B) => C,
) => {
  <R2, E2>(that: Fx<R2, E2, B>): <R1, E1>(self: Fx<R1, E1, A>) => Fx<R2 | R1, E2 | E1, C>
  <R1, E1, R2, E2>(self: Fx<R1, E1, A>, that: Fx<R2, E2, B>): Fx<R1 | R2, E1 | E2, C>
} = SA.lift2(SemiApplicative)

export const zipWith: {
  <R2, E2, B, A, C>(that: Fx<R2, E2, B>, f: (a: A, b: B) => C): <R1, E1>(
    self: Fx<R1, E1, A>,
  ) => Fx<R2 | R1, E2 | E1, C>
  <R1, E1, A, R2, E2, B, C>(self: Fx<R1, E1, A>, that: Fx<R2, E2, B>, f: (a: A, b: B) => C): Fx<
    R1 | R2,
    E1 | E2,
    C
  >
} = SA.zipWith(SemiApplicative)
