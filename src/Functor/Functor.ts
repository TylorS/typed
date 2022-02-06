import { HKT, Kind } from '@/HKT'

export interface Functor<T extends HKT> {
  readonly map: <A, B>(
    f: (a: A) => B,
  ) => <S, R, E>(kind: Kind<T, S, R, E, A>) => Kind<T, S, R, E, B>
}

export function map<F extends HKT, G extends HKT>(
  F: Functor<F>,
  G: Functor<G>,
): <A, B>(
  f: (a: A) => B,
) => <S1, R1, E1, S2, R2, E2>(
  fa: Kind<F, S1, R1, E1, Kind<G, S2, R2, E2, A>>,
) => Kind<F, S1, R1, E1, Kind<G, S2, R2, E2, B>> {
  return (f) => (fa) => F.map((ga) => G.map(f)(ga))(fa)
}
