import * as Applicative_ from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as C from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Either, isRight } from 'fp-ts/Either'
import * as F from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import * as O from 'fp-ts/Option'
import * as P from 'fp-ts/Pointed'

import * as FN from './function'
import { MonadRec2 } from './MonadRec'

export type AsyncData<E, A> = NoData | Loading | AsyncFailure<E> | AsyncSuccess<A>

export interface NoData {
  readonly _tag: 'noData'
}
export const NoData: NoData = { _tag: 'noData' }

export const isNoData = <E, A>(data: AsyncData<E, A>): data is NoData => data._tag === 'noData'

export interface Loading {
  readonly _tag: 'loading'
  readonly progress: O.Option<Progress>
}

export const loading = (progress: O.Option<Progress> = O.none): Loading => ({
  _tag: 'loading',
  progress,
})

export const isLoading = <E, A>(data: AsyncData<E, A>): data is Loading => data._tag === 'loading'

export interface Progress {
  readonly total: O.Option<number>
  readonly loaded: number
}

export const progress = (loaded: number, total: O.Option<number> = O.none): Progress => ({
  loaded,
  total,
})

export type AsyncFailure<A> = RefreshingFailure<A> | Failure<A>

export type RefreshingFailure<A> = {
  readonly _tag: 'refreshing-failure'
  readonly error: A
  readonly progress: O.Option<Progress>
}

export const refreshingFailure = <A>(
  error: A,
  progress: O.Option<Progress> = O.none,
): RefreshingFailure<A> => ({
  _tag: 'refreshing-failure',
  error,
  progress,
})

export const isRefreshingFailure = <E, A>(data: AsyncData<E, A>): data is RefreshingFailure<E> =>
  data._tag === 'refreshing-failure'

export type Failure<A> = {
  readonly _tag: 'failure'
  readonly error: A
}

export const failure = <A>(error: A): Failure<A> => ({
  _tag: 'failure',
  error,
})

export const isFailure = <E, A>(data: AsyncData<E, A>): data is Failure<E> =>
  data._tag === 'failure'

export const isAsyncFailure = <E, A>(data: AsyncData<E, A>): data is AsyncFailure<E> =>
  isFailure(data) || isRefreshingFailure(data)

export type AsyncSuccess<A> = RefreshingSuccess<A> | Success<A>

export type RefreshingSuccess<A> = {
  readonly _tag: 'refreshing-success'
  readonly value: A
  readonly progress: O.Option<Progress>
}

export const refreshingSuccess = <A>(
  value: A,
  progress: O.Option<Progress> = O.none,
): RefreshingSuccess<A> => ({
  _tag: 'refreshing-success',
  value,
  progress,
})

export const isRefreshingSuccess = <E, A>(data: AsyncData<E, A>): data is RefreshingSuccess<A> =>
  data._tag === 'refreshing-success'

export type Success<A> = {
  readonly _tag: 'success'
  readonly value: A
}

export const success = <A>(value: A): Success<A> => ({
  _tag: 'success',
  value,
})

export const isSuccess = <E, A>(data: AsyncData<E, A>): data is Success<A> =>
  data._tag === 'success'

export const isAsyncSuccess = <E, A>(data: AsyncData<E, A>): data is AsyncSuccess<A> =>
  isSuccess(data) || isRefreshingSuccess(data)

export const matchW = <A, B, C, D, E, F, G, H>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
  onFailure: (error: C) => D,
  onRefreshingFailure: (error: C, progress: O.Option<Progress>) => E,
  onSuccess: (value: F) => G,
  onRefreshingSuccess: (value: F, progress: O.Option<Progress>) => H,
) => (data: AsyncData<C, F>): A | B | D | E | G | H => {
  switch (data._tag) {
    case 'noData':
      return onNoData()
    case 'loading':
      return onLoading(data.progress)
    case 'failure':
      return onFailure(data.error)
    case 'success':
      return onSuccess(data.value)
    case 'refreshing-failure':
      return onRefreshingFailure(data.error, data.progress)
    case 'refreshing-success':
      return onRefreshingSuccess(data.value, data.progress)
  }
}

export const match = matchW as <R, E, A>(
  onNoData: () => R,
  onLoading: (progress: O.Option<Progress>) => R,
  onFailure: (error: E) => R,
  onRefreshingFailure: (error: E, progress: O.Option<Progress>) => R,
  onSuccess: (value: A) => R,
  onRefreshingSuccess: (value: A, progress: O.Option<Progress>) => R,
) => (data: AsyncData<E, A>) => R

export const URI = '@typed/fp/AsyncData'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: AsyncData<E, A>
  }
}

export const of = <A, E = never>(value: A): AsyncData<E, A> => success(value)

export const Pointed: P.Pointed2<URI> = {
  of,
}

export const map = <A, B>(f: FN.Arity1<A, B>) => <E>(data: AsyncData<E, A>): AsyncData<E, B> =>
  isSuccess(data)
    ? success(f(data.value))
    : isRefreshingSuccess(data)
    ? refreshingSuccess(f(data.value), data.progress)
    : data

export const Functor: F.Functor2<URI> = {
  map,
}

export const chainW = <A, E1, B>(f: FN.Arity2<A, O.Option<Progress>, AsyncData<E1, B>>) => <E2>(
  data: AsyncData<E2, A>,
): AsyncData<E1 | E2, B> =>
  isSuccess(data)
    ? f(data.value, O.none)
    : isRefreshingSuccess(data)
    ? f(data.value, data.progress)
    : data

export const chain = chainW as <A, E, B>(
  f: FN.Arity2<A, O.Option<Progress>, AsyncData<E, B>>,
) => (data: AsyncData<E, A>) => AsyncData<E, B>

export const Chain: C.Chain2<URI> = {
  ...Functor,
  chain,
}

export const bind = C.bind(Chain)
export const chainFirst = C.chainFirst(Chain)
export const ap = C.ap(Chain)

export const Apply: Ap.Apply2<URI> = { ...Functor, ap }

export const apFirst = Ap.apFirst(Apply)
export const apS = Ap.apS(Apply)
export const apSecond = Ap.apSecond(Apply)
export const apT = Ap.apT(Apply)
export const getSemigroup = Ap.getApplySemigroup(Apply)

export const Applicative: Applicative_.Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const getMonoid = Applicative_.getApplicativeMonoid(Applicative)

export const Monad: Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

export const chainRec = <A, E, B>(f: (value: A) => AsyncData<E, Either<A, B>>) => (
  value: A,
): AsyncData<E, B> => {
  let data = f(value)

  while (isAsyncSuccess(data)) {
    const either = data.value

    if (isRight(either)) {
      return isRefreshingSuccess(data)
        ? refreshingSuccess(either.right, data.progress)
        : success(either.right)
    }

    data = f(either.left)
  }

  return data
}

export const ChainRec: ChainRec2<URI> = { chainRec }

export const MonadRec: MonadRec2<URI> = { ...Monad, chainRec }
