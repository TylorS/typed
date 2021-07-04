import * as AD from 'fp-ts/Alt'
import * as Alternative_ from 'fp-ts/Alternative'
import * as App from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as Ch from 'fp-ts/Chain'
import { Eq } from 'fp-ts/Eq'
import { constant, constFalse, flow, identity, Lazy, pipe } from 'fp-ts/function'
import * as F from 'fp-ts/Functor'
import { Monad1 } from 'fp-ts/Monad'
import { Monoid } from 'fp-ts/Monoid'
import * as O from 'fp-ts/Option'
import { Pointed1 } from 'fp-ts/Pointed'
import { Predicate } from 'fp-ts/Predicate'
import { Semigroup } from 'fp-ts/Semigroup'
import { Show } from 'fp-ts/Show'

import { deepEqualsEq } from './Eq'

export type AsyncData<A> = NoData | Loading | Refresh<A> | Replete<A>

export type Value<A> = [A] extends [AsyncData<infer R>] ? R : never

export const isNoData = <A>(data: AsyncData<A>): data is NoData => data._tag === 'NoData'

export const isLoading = <A>(data: AsyncData<A>): data is Loading => data._tag === 'Loading'

export const isRefresh = <A>(data: AsyncData<A>): data is Refresh<A> => data._tag === 'Refresh'

export const isReplete = <A>(data: AsyncData<A>): data is Replete<A> => data._tag === 'Replete'

export interface NoData {
  readonly _tag: 'NoData'
}

export const NoData: NoData = { _tag: 'NoData' }

export interface Loading {
  readonly _tag: 'Loading'
  readonly progress: O.Option<Progress>
}

export const Loading = (progress: O.Option<Progress> = O.none): Loading => ({
  _tag: 'Loading',
  progress,
})

export interface Progress {
  readonly loaded: number
  readonly total: O.Option<number>
}

export const Progress = (loaded: number, total: O.Option<number> = O.none): Progress => ({
  loaded,
  total,
})

Progress.show = (p: Progress): string =>
  pipe(
    p.total,
    O.matchW(
      () => `${p.loaded}`,
      () => `${p.loaded}/${p.total}`,
    ),
  )

Progress.equals = (s: Progress) => (f: Progress) => deepEqualsEq.equals(s)(f)

Progress.concat =
  (s: Progress) =>
  (f: Progress): Progress =>
    pipe(
      O.Do,
      O.apS('sTotal', s.total),
      O.apS('fTotal', f.total),
      O.map(({ sTotal, fTotal }) => Progress(f.loaded + s.loaded, O.some(fTotal + sTotal))),
      O.getOrElse(() => Progress(f.loaded + s.loaded)),
    )

export interface Refresh<A> {
  readonly _tag: 'Refresh'
  readonly value: A
  readonly progress: O.Option<Progress>
}

export const Refresh = <A>(value: A, progress: O.Option<Progress> = O.none): Refresh<A> => ({
  _tag: 'Refresh',
  value,
  progress,
})

export interface Replete<A> {
  readonly _tag: 'Replete'
  readonly value: A
}

export const Replete = <A>(value: A): Replete<A> => ({ _tag: 'Replete', value })

export const matchW =
  <A, B, C, D, E>(
    onNoData: () => A,
    onLoading: (progress: O.Option<Progress>) => B,
    onRefresh: (value: C, progress: O.Option<Progress>) => D,
    onReplete: (value: C) => E,
  ) =>
  (data: AsyncData<C>): A | B | D | E => {
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
    onLoading: (progress: O.Option<Progress>) => B,
    onRefreshOrReplete: (value: C) => D,
  ) =>
  (data: AsyncData<C>): A | B | D => {
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
) => (data: AsyncData<B>) => A = matchW

export const toLoading = <A>(data: AsyncData<A>): AsyncData<A> =>
  pipe(data, matchW(Loading, Loading, Refresh, Refresh))

export const fromNullable = <A>(a: A | null | undefined): AsyncData<A> =>
  a === null || a === undefined ? NoData : Replete(a)

export const getShow = <A>(S: Show<A>): Show<AsyncData<A>> => ({
  show: matchW(
    constant('NoData'),
    O.matchW(
      () => `Loading`,
      (p) => `Loading<${Progress.show(p)}>`,
    ),
    (v, p) =>
      pipe(
        p,
        O.matchW(
          () => `Refresh(${S.show(v)})`,
          (p) => `Refresh(${S.show(v)}, ${Progress.show(p)})`,
        ),
      ),
    (v) => `Replete(${S.show(v)})`,
  ),
})

export const getEq = <A>(S: Eq<A>): Eq<AsyncData<A>> => {
  const OptionProgressEq = O.getEq(Progress)

  return {
    equals: (a) => (b) =>
      pipe(
        a,
        matchW(
          () => isNoData(b),
          (p) => isLoading(b) && OptionProgressEq.equals(p)(b.progress),
          (a, p) => isRefresh(b) && S.equals(a)(b.value) && OptionProgressEq.equals(p)(b.progress),
          (a) => isRefresh(b) && S.equals(a)(b.value),
        ),
      ),
  }
}

export const getSemigroup = <A>(S: Semigroup<A>): Semigroup<AsyncData<A>> => {
  const OptionProgressSemigroup = O.getMonoid(Progress)

  return {
    concat:
      (secondD: AsyncData<A>) =>
      (firstD: AsyncData<A>): AsyncData<A> =>
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
                  (second, sp) => Refresh(second, OptionProgressSemigroup.concat(sp)(fp)),
                  Refresh,
                ),
              ),
            (first, fp) =>
              pipe(
                secondD,
                matchW(
                  constant(firstD),
                  constant(firstD),
                  (second, sp) =>
                    Refresh(pipe(first, S.concat(second)), OptionProgressSemigroup.concat(sp)(fp)),
                  (second) => Refresh(pipe(first, S.concat(second)), fp),
                ),
              ),
            (first) =>
              pipe(
                secondD,
                matchW(
                  constant(firstD),
                  (sp) => Refresh(first, sp),
                  (second, sp) => Refresh(pipe(first, S.concat(second)), sp),
                  (second) => Replete(pipe(first, S.concat(second))),
                ),
              ),
          ),
        ),
  }
}

export const getMonoid = <A>(S: Semigroup<A>): Monoid<AsyncData<A>> => ({
  ...getSemigroup(S),
  empty: NoData,
})

export const getOrElse =
  <A>(onInitial: () => A, onPending: () => A) =>
  (ma: AsyncData<A>): A =>
    match<A, A>(onInitial, onPending, identity, identity)(ma)

export const elem =
  <A>(E: Eq<A>) =>
  (a: A) =>
  (ma: AsyncData<A>): boolean =>
    matchW(constFalse, constFalse, E.equals(a), E.equals(a))(ma)

export const exists =
  <A>(predicate: Predicate<A>) =>
  (ma: AsyncData<A>): boolean =>
    pipe(ma, matchW(constFalse, constFalse, predicate, predicate))

export const of = <A>(value: A): AsyncData<A> => Replete(value)

export const map =
  <A, B>(f: (value: A) => B) =>
  (data: AsyncData<A>): AsyncData<B> =>
    pipe(
      data,
      matchW(constant(NoData), Loading, (a, p) => Refresh(f(a), p), flow(f, Replete)),
    )

export const chain =
  <A, B>(f: (value: A) => AsyncData<B>) =>
  (data: AsyncData<A>): AsyncData<B> =>
    pipe(data, matchW(constant(NoData), Loading, f, f))

export const URI = '@typed/fp/AsyncData'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: AsyncData<A>
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

export const alt =
  <A>(f: Lazy<AsyncData<A>>) =>
  <B>(b: AsyncData<B>): AsyncData<A | B> =>
    pipe(b, matchW(f, f, Refresh, Replete))

export const Alt: AD.Alt1<URI> = {
  ...Functor,
  alt,
}

export const altAll = AD.altAll(Alt)

export const zero = <A>(): AsyncData<A> => NoData

export const Alternative: Alternative_.Alternative1<URI> = {
  ...Alt,
  zero,
}

export const fromOption = <A>(option: O.Option<A>): AsyncData<A> =>
  pipe(
    option,
    O.matchW(() => NoData, Replete),
  )

export const toOption = <A>(data: AsyncData<A>): O.Option<A> =>
  pipe(
    data,
    matchW(
      () => O.none,
      () => O.none,
      O.some,
      O.some,
    ),
  )

// TODO
// Foldable
// Traversable
// Compactable
// Filterable
// FromEither
