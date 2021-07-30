import * as AD from 'fp-ts/Alt'
import * as Alternative_ from 'fp-ts/Alternative'
import * as App from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as Ch from 'fp-ts/Chain'
import { Compactable1 } from 'fp-ts/Compactable'
import * as Ei from 'fp-ts/Either'
import { Eq } from 'fp-ts/Eq'
import { Filterable1 } from 'fp-ts/Filterable'
import { Foldable1 } from 'fp-ts/Foldable'
import { constant, constFalse, flow, identity, Lazy, pipe } from 'fp-ts/function'
import * as F from 'fp-ts/Functor'
import { HKT } from 'fp-ts/HKT'
import { Monad1 } from 'fp-ts/Monad'
import { Monoid } from 'fp-ts/Monoid'
import * as O from 'fp-ts/Option'
import { Pointed1 } from 'fp-ts/Pointed'
import { Predicate } from 'fp-ts/Predicate'
import { Semigroup } from 'fp-ts/Semigroup'
import { Separated } from 'fp-ts/Separated'
import { Show } from 'fp-ts/Show'
import { Traversable1 } from 'fp-ts/Traversable'

import * as P from './Progress'

export type Data<A> = NoData | Loading | Refresh<A> | Replete<A>

export type Value<A> = [A] extends [Data<infer R>] ? R : never

export const isNoData = <A>(data: Data<A>): data is NoData => data._tag === 'NoData'

export const isLoading = <A>(data: Data<A>): data is Loading => data._tag === 'Loading'

export const isRefresh = <A>(data: Data<A>): data is Refresh<A> => data._tag === 'Refresh'

export const isReplete = <A>(data: Data<A>): data is Replete<A> => data._tag === 'Replete'

export const hasValue = <A>(data: Data<A>): data is Refresh<A> | Replete<A> =>
  isRefresh(data) || isReplete(data)

export interface NoData {
  readonly _tag: 'NoData'
}

export const noData: NoData = { _tag: 'NoData' }

export interface Loading {
  readonly _tag: 'Loading'
  readonly progress: O.Option<P.Progress>
}

export const loading: Loading = {
  _tag: 'Loading',
  progress: O.none,
}

export const fromProgress = (progress: P.Progress): Loading => ({
  _tag: 'Loading',
  progress: O.some(progress),
})

export interface Refresh<A> {
  readonly _tag: 'Refresh'
  readonly value: A
  readonly progress: O.Option<P.Progress>
}

export const refresh = <A>(value: A, progress: O.Option<P.Progress> = O.none): Refresh<A> => ({
  _tag: 'Refresh',
  value,
  progress,
})

export interface Replete<A> {
  readonly _tag: 'Replete'
  readonly value: A
}

export const replete = <A>(value: A): Replete<A> => ({ _tag: 'Replete', value })

export const matchW =
  <A, B, C, D, E>(
    onNoData: () => A,
    onLoading: (progress: O.Option<P.Progress>) => B,
    onRefresh: (value: C, progress: O.Option<P.Progress>) => D,
    onReplete: (value: C) => E,
  ) =>
  (data: Data<C>): A | B | D | E => {
    switch (data._tag) {
      case 'NoData':
        return onNoData()
      case 'Loading':
        return onLoading(data.progress)
      case 'Refresh':
        return onRefresh(data.value, data.progress)
      case 'Replete':
        return onReplete(data.value)
    }
  }

export const match3W =
  <A, B, C, D>(
    onNoData: () => A,
    onLoading: (progress: O.Option<P.Progress>) => B,
    onRefreshOrReplete: (value: C) => D,
  ) =>
  (data: Data<C>): A | B | D => {
    switch (data._tag) {
      case 'NoData':
        return onNoData()
      case 'Loading':
        return onLoading(data.progress)
      case 'Refresh':
      case 'Replete':
        return onRefreshOrReplete(data.value)
    }
  }

export const match: <A, B>(
  onNoData: () => A,
  onLoading: () => A,
  onRefresh: (value: B) => A,
  onReplete: (value: B) => A,
) => (data: Data<B>) => A = matchW

export const toLoading = <A>(data: Data<A>): Data<A> =>
  pipe(
    data,
    matchW(
      () => loading,
      flow(
        O.map(fromProgress),
        O.getOrElse(() => loading),
      ),
      refresh,
      refresh,
    ),
  )

export const fromNullable = <A>(a: A | null | undefined): Data<A> =>
  a === null || a === undefined ? noData : replete(a)

export const getShow = <A>(S: Show<A>): Show<Data<A>> => ({
  show: matchW(
    constant('NoData'),
    O.matchW(
      () => `Loading`,
      (p) => `Loading(${P.Show.show(p)})`,
    ),
    (v, p) =>
      pipe(
        p,
        O.matchW(
          () => `Refresh(${S.show(v)})`,
          (p) => `Refresh(${S.show(v)}, ${P.Show.show(p)})`,
        ),
      ),
    (v) => `Replete(${S.show(v)})`,
  ),
})

export const getEq = <A>(S: Eq<A>): Eq<Data<A>> => {
  const OptionProgressEq = O.getEq(P.Eq)

  return {
    equals: (a) => (b) =>
      pipe(
        a,
        matchW(
          () => isNoData(b),
          (p) => isLoading(b) && OptionProgressEq.equals(p)(b.progress),
          (a, p) => isRefresh(b) && S.equals(a)(b.value) && OptionProgressEq.equals(p)(b.progress),
          (a) => isReplete(b) && S.equals(a)(b.value),
        ),
      ),
  }
}

export const getSemigroup = <A>(S: Semigroup<A>): Semigroup<Data<A>> => {
  const OptionProgressSemigroup = O.getMonoid(P.Semigroup)

  return {
    concat:
      (secondD: Data<A>) =>
      (firstD: Data<A>): Data<A> =>
        pipe(
          firstD,
          matchW(
            constant(secondD), // Empty value
            (fp) =>
              pipe(
                secondD,
                matchW(
                  constant(firstD),
                  constant(firstD),
                  (second, sp) => refresh(second, OptionProgressSemigroup.concat(sp)(fp)),
                  refresh,
                ),
              ),
            (first, fp) =>
              pipe(
                secondD,
                matchW(
                  constant(firstD),
                  constant(firstD),
                  (second, sp) =>
                    refresh(pipe(first, S.concat(second)), OptionProgressSemigroup.concat(sp)(fp)),
                  (second) => refresh(pipe(first, S.concat(second)), fp),
                ),
              ),
            (first) =>
              pipe(
                secondD,
                matchW(
                  constant(firstD),
                  (sp) => refresh(first, sp),
                  (second, sp) => refresh(pipe(first, S.concat(second)), sp),
                  (second) => replete(pipe(first, S.concat(second))),
                ),
              ),
          ),
        ),
  }
}

export const getMonoid = <A>(S: Semigroup<A>): Monoid<Data<A>> => ({
  ...getSemigroup(S),
  empty: noData,
})

export const getOrElse =
  <A>(onInitial: () => A, onLoading: (progress: O.Option<P.Progress>) => A) =>
  (ma: Data<A>): A =>
    match3W(onInitial, onLoading, identity)(ma)

export const getOrElseW =
  <A, B>(onInitial: () => A, onLoading: (progress: O.Option<P.Progress>) => B) =>
  <C>(ma: Data<C>): A | B | C =>
    match3W(onInitial, onLoading, identity)(ma)

export const elem =
  <A>(E: Eq<A>) =>
  (a: A) =>
  (ma: Data<A>): boolean =>
    match3W(constFalse, constFalse, E.equals(a))(ma)

export const exists =
  <A>(predicate: Predicate<A>) =>
  (ma: Data<A>): boolean =>
    pipe(ma, match3W(constFalse, constFalse, predicate))

export const of = <A>(value: A): Data<A> => replete(value)

export const map =
  <A, B>(f: (value: A) => B) =>
  (data: Data<A>): Data<B> =>
    pipe(
      data,
      matchW(
        constant(noData),
        flow(
          O.map(fromProgress),
          O.getOrElse(() => loading),
        ),
        (a, p) => refresh(f(a), p),
        flow(f, replete),
      ),
    )

export const chain =
  <A, B>(f: (value: A) => Data<B>) =>
  (data: Data<A>): Data<B> =>
    pipe(
      data,
      match3W(
        constant(noData),
        flow(
          O.map(fromProgress),
          O.getOrElse(() => loading),
        ),
        f,
      ),
    )

export const URI = '@typed/fp/Data'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: Data<A>
  }
}

export const Pointed: Pointed1<URI> = {
  of,
}

export const Functor: F.Functor1<URI> = {
  map,
}

export const bindTo = F.bindTo(Functor)
export const flap = F.flap(Functor)
export const tupled = F.tupled(Functor)

export const Chain: Ch.Chain1<URI> = {
  ...Functor,
  chain,
}

export const ap = Ch.ap(Chain)
export const bind = Ch.bind(Chain)
export const chainFirst = Ch.chainFirst(Chain)

export const Apply: Ap.Apply1<URI> = {
  ...Functor,
  ap,
}

export const apFirst = Ap.apFirst(Apply)
export const apS = Ap.apS(Apply)
export const apSecond = Ap.apSecond(Apply)
export const apT = Ap.apT(Apply)
export const getApplySemigroup = Ap.getApplySemigroup(Apply)

export const Applicative: App.Applicative1<URI> = {
  ...Apply,
  ...Pointed,
}

export const getApplicativeMonoid = App.getApplicativeMonoid(Applicative)

export const Monad: Monad1<URI> = {
  ...Chain,
  ...Pointed,
}

export const chainRec =
  <A, B>(f: (value: A) => Data<Ei.Either<A, B>>) =>
  (value: A): Data<B> => {
    let data = f(value)

    while (!isNoData(data) && !isLoading(data)) {
      if (Ei.isRight(data.value)) {
        return replete(data.value.right)
      }

      data = f(data.value.left)
    }

    return data
  }

export const alt =
  <A>(f: Lazy<Data<A>>) =>
  <B>(b: Data<B>): Data<A | B> =>
    pipe(b, matchW(f, f, refresh, replete))

export const Alt: AD.Alt1<URI> = {
  ...Functor,
  alt,
}

export const altAll = AD.altAll(Alt)

export const zero = <A>(): Data<A> => noData

export const Alternative: Alternative_.Alternative1<URI> = {
  ...Alt,
  zero,
}

export const fromOption = <A>(option: O.Option<A>): Data<A> =>
  pipe(
    option,
    O.matchW(() => noData, replete),
  )

export const toOption = <A>(data: Data<A>): O.Option<A> =>
  pipe(
    data,
    matchW(
      () => O.none,
      () => O.none,
      O.some,
      O.some,
    ),
  )

export function foldMap<M>(M: Monoid<M>): <A>(f: (a: A) => M) => (fa: Data<A>) => M {
  return (f) => (fa) =>
    pipe(
      fa,
      match3W(
        () => M.empty,
        () => M.empty,
        f,
      ),
    )
}

export const reduce =
  <A, B>(seed: A, f: (acc: A, value: B) => A) =>
  (data: Data<B>): A =>
    pipe(
      data,
      match3W(constant(seed), constant(seed), (b) => f(seed, b)),
    )

export const reduceRight =
  <A, B>(seed: A, f: (value: B, acc: A) => A) =>
  (data: Data<B>): A =>
    pipe(
      data,
      match3W(constant(seed), constant(seed), (b) => f(b, seed)),
    )

export const Foldable: Foldable1<URI> = {
  reduce,
  foldMap,
  reduceRight,
}

export function traverse<F>(F: App.Applicative<F>) {
  return <A, B>(f: (value: A) => HKT<F, B>) =>
    (data: Data<A>): HKT<F, Data<B>> =>
      pipe(
        data,
        matchW(
          () => F.of(noData),
          O.matchW(
            () => F.of(loading),
            (p) => F.of(fromProgress(p)),
          ),
          (a, progress) =>
            pipe(
              a,
              f,
              F.map((b) => refresh(b, progress)),
            ),
          flow(f, F.map(replete)),
        ),
      )
}

export const Traversable: Traversable1<URI> = {
  ...Functor,
  traverse,
}

export const compact = <A>(dataOption: Data<O.Option<A>>): Data<A> =>
  pipe(dataOption, chain(O.matchW(() => noData, replete)))

export const separate = <E, A>(dataEither: Data<Ei.Either<E, A>>): Separated<Data<E>, Data<A>> => {
  return {
    left: pipe(dataEither, chain(Ei.matchW(replete, () => noData))),
    right: pipe(dataEither, chain(Ei.matchW(() => noData, replete))),
  }
}

export const Compactable: Compactable1<URI> = {
  compact,
  separate,
}

export const partitionMap: Filterable1<URI>['partitionMap'] = (f) => (fa) =>
  pipe(fa, map(f), separate)

export const partition = flow(Ei.fromPredicate, partitionMap) as Filterable1<URI>['partition']

export const filterMap: Filterable1<URI>['filterMap'] = (f) => (fa) => pipe(fa, map(f), compact)

export const filter = flow(O.fromPredicate, filterMap) as Filterable1<URI>['filter']

export const Filterable: Filterable1<URI> = {
  partitionMap,
  partition,
  filterMap,
  filter,
}
