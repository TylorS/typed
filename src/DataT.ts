import * as Apply from 'fp-ts/Apply'
import * as Chain from 'fp-ts/Chain'
import { flow, Lazy, pipe } from 'fp-ts/function'
import * as Functor from 'fp-ts/Functor'
import { HKT, Kind, Kind2, Kind3, Kind4, URIS, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'
import * as Monad from 'fp-ts/Monad'
import * as O from 'fp-ts/Option'
import {
  Pointed,
  Pointed1,
  Pointed2,
  Pointed2C,
  Pointed3,
  Pointed3C,
  Pointed4,
} from 'fp-ts/Pointed'

import * as D from './Data'
import { ApplyVariance, Initial } from './Hkt'

export function noData<
  F extends URIS4,
  S = Initial<F, 'S'>,
  R = Initial<F, 'R'>,
  E = Initial<F, 'E'>,
>(P: Pointed4<F>): Kind4<F, S, R, E, D.NoData>
export function noData<F extends URIS3, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  P: Pointed3<F>,
): Kind3<F, R, E, D.NoData>
export function noData<F extends URIS2, E = Initial<F, 'E'>>(P: Pointed2<F>): Kind2<F, E, D.NoData>
export function noData<F extends URIS>(P: Pointed1<F>): Kind<F, D.NoData>
export function noData<F>(P: Pointed<F>): HKT<F, D.NoData>
export function noData<F>(P: Pointed<F>) {
  return P.of(D.NoData)
}

export function loading<
  F extends URIS4,
  S = Initial<F, 'S'>,
  R = Initial<F, 'R'>,
  E = Initial<F, 'E'>,
>(P: Pointed4<F>): (progress?: O.Option<D.Progress>) => Kind4<F, S, R, E, D.Loading>
export function loading<F extends URIS3, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  P: Pointed3<F>,
): (progress?: O.Option<D.Progress>) => Kind3<F, R, E, D.Loading>
export function loading<F extends URIS2, E = Initial<F, 'E'>>(
  P: Pointed2<F>,
): (progress?: O.Option<D.Progress>) => Kind2<F, E, D.Loading>
export function loading<F extends URIS>(
  P: Pointed1<F>,
): (progress?: O.Option<D.Progress>) => Kind<F, D.Loading>
export function loading<F>(P: Pointed<F>): (progress?: O.Option<D.Progress>) => HKT<F, D.Loading>
export function loading<F>(P: Pointed<F>) {
  return flow(D.Loading, P.of)
}

export function refresh<F extends URIS4>(
  P: Pointed4<F>,
): <A, S = Initial<F, 'S'>, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  value: A,
  progress?: O.Option<D.Progress> | undefined,
) => Kind4<F, S, R, E, D.Refresh<A>>
export function refresh<F extends URIS3, E>(
  P: Pointed3C<F, E>,
): <A, R = Initial<F, 'R'>>(
  value: A,
  progress?: O.Option<D.Progress> | undefined,
) => Kind3<F, R, E, D.Refresh<A>>
export function refresh<F extends URIS3>(
  P: Pointed3<F>,
): <A, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  value: A,
  progress?: O.Option<D.Progress> | undefined,
) => Kind3<F, R, E, D.Refresh<A>>
export function refresh<F extends URIS2, E>(
  P: Pointed2C<F, E>,
): <A>(value: A, progress?: O.Option<D.Progress> | undefined) => Kind2<F, E, D.Refresh<A>>
export function refresh<F extends URIS2>(
  P: Pointed2<F>,
): <A, E = Initial<F, 'E'>>(
  value: A,
  progress?: O.Option<D.Progress> | undefined,
) => Kind2<F, E, D.Refresh<A>>
export function refresh<F extends URIS>(
  P: Pointed1<F>,
): <A>(value: A, progress?: O.Option<D.Progress> | undefined) => Kind<F, D.Refresh<A>>
export function refresh<F>(
  P: Pointed<F>,
): <A>(value: A, progress?: O.Option<D.Progress> | undefined) => HKT<F, D.Refresh<A>>
export function refresh<F>(P: Pointed<F>) {
  return flow(D.Refresh, P.of)
}

export function replete<F extends URIS4>(
  P: Pointed4<F>,
): <A, S = Initial<F, 'S'>, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  value: A,
) => Kind4<F, S, R, E, D.Replete<A>>
export function replete<F extends URIS3, E>(
  P: Pointed3C<F, E>,
): <A, R = Initial<F, 'R'>>(value: A) => Kind3<F, R, E, D.Replete<A>>
export function replete<F extends URIS3>(
  P: Pointed3<F>,
): <A, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(value: A) => Kind3<F, R, E, D.Replete<A>>
export function replete<F extends URIS2, E>(
  P: Pointed2C<F, E>,
): <A>(value: A) => Kind2<F, E, D.Replete<A>>
export function replete<F extends URIS2>(
  P: Pointed2<F>,
): <A, E = Initial<F, 'E'>>(value: A) => Kind2<F, E, D.Replete<A>>
export function replete<F extends URIS>(P: Pointed1<F>): <A>(value: A) => Kind<F, D.Replete<A>>
export function replete<F>(P: Pointed<F>): <A>(value: A) => HKT<F, D.Replete<A>>
export function replete<F>(P: Pointed<F>) {
  return flow(D.Replete, P.of)
}

export function repleteF<F extends URIS4>(
  F: Functor.Functor4<F>,
): <S, R, E, A>(fa: Kind4<F, S, R, E, A>) => Kind4<F, S, R, E, D.Replete<A>>
export function repleteF<F extends URIS3, E>(
  F: Functor.Functor3C<F, E>,
): <R, A>(fa: Kind3<F, R, E, A>) => Kind3<F, R, E, D.Replete<A>>
export function repleteF<F extends URIS3>(
  F: Functor.Functor3<F>,
): <R, E, A>(fa: Kind3<F, R, E, A>) => Kind3<F, R, E, D.Replete<A>>
export function repleteF<F extends URIS2, E>(
  F: Functor.Functor2C<F, E>,
): <A>(fa: Kind2<F, E, A>) => Kind2<F, E, D.Replete<A>>
export function repleteF<F extends URIS2>(
  F: Functor.Functor2<F>,
): <E, A>(fa: Kind2<F, E, A>) => Kind2<F, E, D.Replete<A>>
export function repleteF<F extends URIS>(
  F: Functor.Functor1<F>,
): <A>(fa: Kind<F, A>) => Kind<F, D.Replete<A>>
export function repleteF<F>(F: Functor.Functor<F>): <A>(fa: HKT<F, A>) => HKT<F, D.Replete<A>>
export function repleteF<F>(F: Functor.Functor<F>) {
  return <A>(fa: HKT<F, A>) => pipe(fa, F.map(D.Replete))
}

export function map<F extends URIS4>(
  F: Functor.Functor4<F>,
): <A, B>(
  f: (a: A) => B,
) => <S, R, E>(fa: Kind4<F, S, R, E, D.Data<A>>) => Kind4<F, S, R, E, D.Data<B>>
export function map<F extends URIS3, E>(
  F: Functor.Functor3C<F, E>,
): <A, B>(f: (a: A) => B) => <R>(fa: Kind3<F, R, E, D.Data<A>>) => Kind3<F, R, E, D.Data<B>>
export function map<F extends URIS3>(
  F: Functor.Functor3<F>,
): <A, B>(f: (a: A) => B) => <R, E>(fa: Kind3<F, R, E, D.Data<A>>) => Kind3<F, R, E, D.Data<B>>
export function map<F extends URIS2, E>(
  F: Functor.Functor2C<F, E>,
): <A, B>(f: (a: A) => B) => (fa: Kind2<F, E, D.Data<A>>) => Kind2<F, E, D.Data<B>>
export function map<F extends URIS2>(
  F: Functor.Functor2<F>,
): <A, B>(f: (a: A) => B) => <E>(fa: Kind2<F, E, D.Data<A>>) => Kind2<F, E, D.Data<B>>
export function map<F extends URIS>(
  F: Functor.Functor1<F>,
): <A, B>(f: (a: A) => B) => (fa: Kind<F, D.Data<A>>) => Kind<F, D.Data<B>>
export function map<F>(
  F: Functor.Functor<F>,
): <A, B>(f: (a: A) => B) => (fa: HKT<F, D.Data<A>>) => HKT<F, D.Data<B>>
export function map<F>(F: Functor.Functor<F>) {
  return Functor.map(F, D.Functor)
}

export function ap<F extends URIS4>(
  F: Apply.Apply4<F>,
): <S1, R1, E1, A>(
  fa: Kind4<F, S1, R1, E1, D.Data<A>>,
) => <S2, R2, E2, B>(
  fab: Kind4<F, S2, R2, E2, D.Data<(a: A) => B>>,
) => Kind4<
  F,
  ApplyVariance<F, 'S', [S1, S2]>,
  ApplyVariance<F, 'R', [R1, R2]>,
  ApplyVariance<F, 'E', [E1, E2]>,
  D.Data<B>
>
export function ap<F extends URIS3, E>(
  F: Apply.Apply3C<F, E>,
): <R1, A>(
  fa: Kind3<F, R1, E, D.Data<A>>,
) => <R2, B>(
  fab: Kind3<F, R2, E, D.Data<(a: A) => B>>,
) => Kind3<F, ApplyVariance<F, 'R', [R1, R2]>, E, D.Data<B>>
export function ap<F extends URIS3>(
  F: Apply.Apply3<F>,
): <R1, E1, A>(
  fa: Kind3<F, R1, E1, D.Data<A>>,
) => <R2, E2, B>(
  fab: Kind3<F, R2, E2, D.Data<(a: A) => B>>,
) => Kind3<F, ApplyVariance<F, 'R', [R1, R2]>, ApplyVariance<F, 'E', [E1, E2]>, D.Data<B>>
export function ap<F extends URIS2, E>(
  F: Apply.Apply2C<F, E>,
): <A>(
  fa: Kind2<F, E, D.Data<A>>,
) => <B>(fab: Kind2<F, E, D.Data<(a: A) => B>>) => Kind2<F, E, D.Data<B>>
export function ap<F extends URIS2>(
  F: Apply.Apply2<F>,
): <E1, A>(
  fa: Kind2<F, E1, D.Data<A>>,
) => <E2, B>(
  fab: Kind2<F, E2, D.Data<(a: A) => B>>,
) => Kind2<F, ApplyVariance<F, 'E', [E1, E2]>, D.Data<B>>
export function ap<F extends URIS>(
  F: Apply.Apply1<F>,
): <A>(fa: Kind<F, D.Data<A>>) => <B>(fab: Kind<F, D.Data<(a: A) => B>>) => Kind<F, D.Data<B>>
export function ap<F>(
  F: Apply.Apply<F>,
): <A>(fa: HKT<F, D.Data<A>>) => <B>(fab: HKT<F, D.Data<(a: A) => B>>) => HKT<F, D.Data<B>>
export function ap<F>(F: Apply.Apply<F>) {
  return Apply.ap(F, D.Apply)
}

export function chain<F extends URIS4>(
  M: Monad.Monad4<F>,
): <A, S1, R1, E1, B>(
  f: (value: A) => Kind4<F, S1, R1, E1, D.Data<B>>,
) => <S2, R2, E2>(
  fa: Kind4<F, S2, R2, E2, D.Data<A>>,
) => Kind4<
  F,
  ApplyVariance<F, 'S', [S1, S2]>,
  ApplyVariance<F, 'R', [R1, R2]>,
  ApplyVariance<F, 'E', [E1, E2]>,
  D.Data<B>
>
export function chain<F extends URIS3>(
  M: Monad.Monad3<F>,
): <A, R1, E1, B>(
  f: (value: A) => Kind3<F, R1, E1, D.Data<B>>,
) => <R2, E2>(
  fa: Kind3<F, R2, E2, D.Data<A>>,
) => Kind3<F, ApplyVariance<F, 'R', [R1, R2]>, ApplyVariance<F, 'E', [E1, E2]>, D.Data<B>>
export function chain<F extends URIS2>(
  M: Monad.Monad2<F>,
): <A, E1, B>(
  f: (value: A) => Kind2<F, E1, D.Data<B>>,
) => <E2>(fa: Kind2<F, E2, D.Data<A>>) => Kind2<F, ApplyVariance<F, 'E', [E1, E2]>, D.Data<B>>
export function chain<F extends URIS>(
  M: Monad.Monad1<F>,
): <A, B>(f: (value: A) => Kind<F, D.Data<B>>) => (fa: Kind<F, D.Data<A>>) => Kind<F, D.Data<B>>
export function chain<F>(
  M: Monad.Monad<F>,
): <A, B>(f: (value: A) => HKT<F, D.Data<B>>) => (fa: HKT<F, D.Data<A>>) => HKT<F, D.Data<B>>
export function chain<F>(M: Monad.Monad<F>) {
  return <A, B>(f: (value: A) => HKT<F, D.Data<B>>) =>
    (fa: HKT<F, D.Data<A>>) =>
      pipe(
        fa,
        M.chain((data) => (D.hasValue(data) ? f(data.value) : M.of(data))),
      )
}

export function alt<M extends URIS4>(
  M: Monad.Monad4<M>,
): <S1, R1, E1, A>(
  second: Lazy<Kind4<M, S1, R1, E1, D.Data<A>>>,
) => <S2, R2, E2>(
  first: Kind4<M, S2, R2, E2, D.Data<A>>,
) => Kind4<
  M,
  ApplyVariance<M, 'S', [S1, S2]>,
  ApplyVariance<M, 'R', [R1, R2]>,
  ApplyVariance<M, 'E', [E1, E2]>,
  D.Data<A>
>
export function alt<M extends URIS3>(
  M: Monad.Monad3<M>,
): <R1, E1, A>(
  second: Lazy<Kind3<M, R1, E1, D.Data<A>>>,
) => <R2, E2>(
  first: Kind3<M, R2, E2, D.Data<A>>,
) => Kind3<M, ApplyVariance<M, 'R', [R1, R2]>, ApplyVariance<M, 'E', [E1, E2]>, D.Data<A>>
export function alt<M extends URIS2>(
  M: Monad.Monad2<M>,
): <E1, A>(
  second: Lazy<Kind2<M, E1, D.Data<A>>>,
) => <E2>(first: Kind2<M, E2, D.Data<A>>) => Kind2<M, ApplyVariance<M, 'E', [E1, E2]>, D.Data<A>>
export function alt<M extends URIS>(
  M: Monad.Monad1<M>,
): <A>(second: Lazy<Kind<M, D.Data<A>>>) => (first: Kind<M, D.Data<A>>) => Kind<M, D.Data<A>>
export function alt<M>(
  M: Monad.Monad<M>,
): <A>(second: Lazy<HKT<M, D.Data<A>>>) => (first: HKT<M, D.Data<A>>) => HKT<M, D.Data<A>>
export function alt<M>(
  M: Monad.Monad<M>,
): <A>(second: Lazy<HKT<M, D.Data<A>>>) => (first: HKT<M, D.Data<A>>) => HKT<M, D.Data<A>> {
  return (second) => M.chain((e) => (D.hasValue(e) ? M.of(e) : second()))
}

export function match<F extends URIS4>(
  F: Functor.Functor4<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: () => A,
  onRefresh: (value: B) => A,
  onReplete: (value: B) => A,
) => <S, R, E>(fa: Kind4<F, S, R, E, D.Data<B>>) => Kind4<F, S, R, E, A>
export function match<F extends URIS3>(
  F: Functor.Functor3<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: () => A,
  onRefresh: (value: B) => A,
  onReplete: (value: B) => A,
) => <R, E>(fa: Kind3<F, R, E, D.Data<B>>) => Kind3<F, R, E, A>
export function match<F extends URIS2>(
  F: Functor.Functor2<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: () => A,
  onRefresh: (value: B) => A,
  onReplete: (value: B) => A,
) => <E>(fa: Kind2<F, E, D.Data<B>>) => Kind2<F, E, A>
export function match<F extends URIS>(
  F: Functor.Functor1<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: () => A,
  onRefresh: (value: B) => A,
  onReplete: (value: B) => A,
) => (fa: Kind<F, D.Data<B>>) => Kind<F, A>
export function match<F>(
  F: Functor.Functor<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: () => A,
  onRefresh: (value: B) => A,
  onReplete: (value: B) => A,
) => (fa: HKT<F, D.Data<B>>) => HKT<F, A>
export function match<F>(F: Functor.Functor<F>) {
  return flow(D.match, F.map)
}

export function matchW<F extends URIS4>(
  F: Functor.Functor4<F>,
): <A, B, C, D, E>(
  onNoData: () => A,
  onLoading: (progress: O.Option<D.Progress>) => B,
  onRefresh: (value: C, progress: O.Option<D.Progress>) => D,
  onReplete: (value: C) => E,
) => <S, R, EF>(fa: Kind4<F, S, R, EF, D.Data<C>>) => Kind4<F, S, R, EF, A | B | D | E>
export function matchW<F extends URIS3>(
  F: Functor.Functor3<F>,
): <A, B, C, D, E>(
  onNoData: () => A,
  onLoading: (progress: O.Option<D.Progress>) => B,
  onRefresh: (value: C, progress: O.Option<D.Progress>) => D,
  onReplete: (value: C) => E,
) => <R, EF>(fa: Kind3<F, R, EF, D.Data<C>>) => Kind3<F, R, EF, A | B | D | E>
export function matchW<F extends URIS2>(
  F: Functor.Functor2<F>,
): <A, B, C, D, E>(
  onNoData: () => A,
  onLoading: (progress: O.Option<D.Progress>) => B,
  onRefresh: (value: C, progress: O.Option<D.Progress>) => D,
  onReplete: (value: C) => E,
) => <EF>(fa: Kind2<F, EF, D.Data<C>>) => Kind2<F, E, A | B | D | E>
export function matchW<F extends URIS>(
  F: Functor.Functor1<F>,
): <A, B, C, D, E>(
  onNoData: () => A,
  onLoading: (progress: O.Option<D.Progress>) => B,
  onRefresh: (value: C, progress: O.Option<D.Progress>) => D,
  onReplete: (value: C) => E,
) => (fa: Kind<F, D.Data<C>>) => Kind<F, A | B | D | E>
export function matchW<F>(
  F: Functor.Functor<F>,
): <A, B, C, D, E>(
  onNoData: () => A,
  onLoading: (progress: O.Option<D.Progress>) => B,
  onRefresh: (value: C, progress: O.Option<D.Progress>) => D,
  onReplete: (value: C) => E,
) => (fa: HKT<F, D.Data<C>>) => HKT<F, A | B | D | E>
export function matchW<F>(F: Functor.Functor<F>) {
  return flow(D.matchW, F.map)
}

export function match3W<F extends URIS4>(
  F: Functor.Functor4<F>,
): <A, B, C, D>(
  onNoData: () => A,
  onLoading: (progress: O.Option<D.Progress>) => B,
  onReplete: (value: C) => D,
) => <S, R, E>(fa: Kind4<F, S, R, E, D.Data<C>>) => Kind4<F, S, R, E, A | B | D>
export function match3W<F extends URIS3>(
  F: Functor.Functor3<F>,
): <A, B, C, D>(
  onNoData: () => A,
  onLoading: (progress: O.Option<D.Progress>) => B,
  onReplete: (value: C) => D,
) => <R, E>(fa: Kind3<F, R, E, D.Data<C>>) => Kind3<F, R, E, A | B | D>
export function match3W<F extends URIS2>(
  F: Functor.Functor2<F>,
): <A, B, C, D>(
  onNoData: () => A,
  onLoading: (progress: O.Option<D.Progress>) => B,
  onReplete: (value: C) => D,
) => <E>(fa: Kind2<F, E, D.Data<C>>) => Kind2<F, E, A | B | D>
export function match3W<F extends URIS>(
  F: Functor.Functor1<F>,
): <A, B, C, D>(
  onNoData: () => A,
  onLoading: (progress: O.Option<D.Progress>) => B,
  onReplete: (value: C) => D,
) => (fa: Kind<F, D.Data<C>>) => Kind<F, A | B | D>
export function match3W<F>(
  F: Functor.Functor<F>,
): <A, B, C, D>(
  onNoData: () => A,
  onLoading: (progress: O.Option<D.Progress>) => B,
  onReplete: (value: C) => D,
) => (fa: HKT<F, D.Data<C>>) => HKT<F, A | B | D>
export function match3W<F>(F: Functor.Functor<F>) {
  return flow(D.match3W, F.map)
}

export function matchE<F extends URIS4>(
  C: Chain.Chain4<F>,
): <S1, R1, E1, A, S2, R2, E2, B, S3, R3, E3, S4, R4, E4>(
  onNoData: () => Kind4<F, S1, R1, E1, A>,
  onLoading: () => Kind4<F, S2, R2, E2, A>,
  onRefresh: (value: B) => Kind4<F, S3, R3, E3, A>,
  onReplete: (value: B) => Kind4<F, S4, R4, E4, A>,
) => <S5, R5, E5>(
  data: Kind4<F, S5, R5, E5, D.Data<B>>,
) => Kind4<
  F,
  ApplyVariance<F, 'S', [S1, S2, S3, S4, S5]>,
  ApplyVariance<F, 'R', [R1, R2, R3, R4, R5]>,
  ApplyVariance<F, 'E', [E1, E2, E3, E4, E5]>,
  A
>
export function matchE<F extends URIS3>(
  C: Chain.Chain3<F>,
): <R1, E1, A, R2, E2, B, R3, E3, R4, E4>(
  onNoData: () => Kind3<F, R1, E1, A>,
  onLoading: () => Kind3<F, R2, E2, A>,
  onRefresh: (value: B) => Kind3<F, R3, E3, A>,
  onReplete: (value: B) => Kind3<F, R4, E4, A>,
) => <R5, E5>(
  data: Kind3<F, R5, E5, D.Data<B>>,
) => Kind3<
  F,
  ApplyVariance<F, 'R', [R1, R2, R3, R4, R5]>,
  ApplyVariance<F, 'E', [E1, E2, E3, E4, E5]>,
  A
>
export function matchE<F extends URIS2>(
  C: Chain.Chain2<F>,
): <E1, A, E2, B, E3, E4>(
  onNoData: () => Kind2<F, E1, A>,
  onLoading: () => Kind2<F, E2, A>,
  onRefresh: (value: B) => Kind2<F, E3, A>,
  onReplete: (value: B) => Kind2<F, E4, A>,
) => <E5>(data: Kind2<F, E5, D.Data<B>>) => Kind2<F, ApplyVariance<F, 'E', [E1, E2, E3, E4, E5]>, A>
export function matchE<F extends URIS>(
  C: Chain.Chain1<F>,
): <A, B>(
  onNoData: () => Kind<F, A>,
  onLoading: () => Kind<F, A>,
  onRefresh: (value: B) => Kind<F, A>,
  onReplete: (value: B) => Kind<F, A>,
) => (data: Kind<F, D.Data<B>>) => Kind<F, A>
export function matchE<F>(
  C: Chain.Chain<F>,
): <A, B>(
  onNoData: () => HKT<F, A>,
  onLoading: () => HKT<F, A>,
  onRefresh: (value: B) => HKT<F, A>,
  onReplete: (value: B) => HKT<F, A>,
) => (data: HKT<F, D.Data<B>>) => HKT<F, A>
export function matchE<F>(C: Chain.Chain<F>) {
  return <A, B>(
      onNoData: () => HKT<F, A>,
      onLoading: () => HKT<F, A>,
      onRefresh: (value: B) => HKT<F, A>,
      onReplete: (value: B) => HKT<F, A>,
    ) =>
    (data: HKT<F, D.Data<B>>) =>
      pipe(data, C.chain(D.matchW(onNoData, onLoading, onRefresh, onReplete)))
}

export function matchEW<F extends URIS4>(
  C: Chain.Chain4<F>,
): <S1, R1, E1, A, S2, R2, E2, B, C, S3, R3, E3, D, S4, R4, E4, E>(
  onNoData: () => Kind4<F, S1, R1, E1, A>,
  onLoading: () => Kind4<F, S2, R2, E2, B>,
  onRefresh: (value: C) => Kind4<F, S3, R3, E3, D>,
  onReplete: (value: C) => Kind4<F, S4, R4, E4, E>,
) => <S5, R5, E5>(
  data: Kind4<F, S5, R5, E5, D.Data<C>>,
) => Kind4<
  F,
  ApplyVariance<F, 'S', [S1, S2, S3, S4, S5]>,
  ApplyVariance<F, 'R', [R1, R2, R3, R4, R5]>,
  ApplyVariance<F, 'E', [E1, E2, E3, E4, E5]>,
  A | B | D | E
>
export function matchEW<F extends URIS3>(
  C: Chain.Chain3<F>,
): <R1, E1, A, R2, E2, B, C, R3, E3, D, R4, E4, E>(
  onNoData: () => Kind3<F, R1, E1, A>,
  onLoading: () => Kind3<F, R2, E2, B>,
  onRefresh: (value: C) => Kind3<F, R3, E3, D>,
  onReplete: (value: C) => Kind3<F, R4, E4, E>,
) => <R5, E5>(
  data: Kind3<F, R5, E5, D.Data<C>>,
) => Kind3<
  F,
  ApplyVariance<F, 'R', [R1, R2, R3, R4, R5]>,
  ApplyVariance<F, 'E', [E1, E2, E3, E4, E5]>,
  A | B | D | E
>
export function matchEW<F extends URIS2>(
  C: Chain.Chain2<F>,
): <E1, A, E2, B, C, E3, D, E4, E>(
  onNoData: () => Kind2<F, E1, A>,
  onLoading: () => Kind2<F, E2, B>,
  onRefresh: (value: C) => Kind2<F, E3, D>,
  onReplete: (value: C) => Kind2<F, E4, E>,
) => <E5>(
  data: Kind2<F, E5, D.Data<C>>,
) => Kind2<F, ApplyVariance<F, 'E', [E1, E2, E3, E4, E5]>, A | B | D | E>
export function matchEW<F extends URIS>(
  C: Chain.Chain1<F>,
): <A, B, C, D, E>(
  onNoData: () => Kind<F, A>,
  onLoading: () => Kind<F, B>,
  onRefresh: (value: C) => Kind<F, D>,
  onReplete: (value: C) => Kind<F, E>,
) => (data: Kind<F, D.Data<C>>) => Kind<F, A | B | D | E>
export function matchEW<F>(
  C: Chain.Chain<F>,
): <A, B, C, D, E>(
  onNoData: () => HKT<F, A>,
  onLoading: () => HKT<F, B>,
  onRefresh: (value: C) => HKT<F, D>,
  onReplete: (value: C) => HKT<F, E>,
) => (data: HKT<F, D.Data<C>>) => HKT<F, A | B | D | E>
export function matchEW<F>(C: Chain.Chain<F>) {
  return <A, B, C, D, E>(
      onNoData: () => HKT<F, A>,
      onLoading: () => HKT<F, B>,
      onRefresh: (value: C) => HKT<F, D>,
      onReplete: (value: C) => HKT<F, E>,
    ) =>
    (data: HKT<F, D.Data<C>>) =>
      pipe(
        data,
        C.chain<D.Data<C>, A | B | D | E>(D.matchW(onNoData, onLoading, onRefresh, onReplete)),
      )
}

export function getOrElse<F extends URIS4>(
  F: Functor.Functor4<F>,
): <A>(
  onNoData: () => A,
  onLoading: () => A,
) => <S, R, E>(ma: Kind4<F, S, R, E, D.Data<A>>) => Kind4<F, S, R, E, A>
export function getOrElse<F extends URIS3>(
  F: Functor.Functor3<F>,
): <A>(
  onNoData: () => A,
  onLoading: () => A,
) => <R, E>(ma: Kind3<F, R, E, D.Data<A>>) => Kind3<F, R, E, A>
export function getOrElse<F extends URIS2>(
  F: Functor.Functor2<F>,
): <A>(onNoData: () => A, onLoading: () => A) => <E>(ma: Kind2<F, E, D.Data<A>>) => Kind2<F, E, A>
export function getOrElse<F extends URIS>(
  F: Functor.Functor1<F>,
): <A>(onNoData: () => A, onLoading: () => A) => (ma: Kind<F, D.Data<A>>) => Kind<F, A>
export function getOrElse<F>(
  F: Functor.Functor<F>,
): <A>(onNoData: () => A, onLoading: () => A) => (ma: HKT<F, D.Data<A>>) => HKT<F, A>
export function getOrElse<F>(
  F: Functor.Functor<F>,
): <A>(onNoData: () => A, onLoading: () => A) => (ma: HKT<F, D.Data<A>>) => HKT<F, A> {
  return flow(D.getOrElse, F.map)
}
