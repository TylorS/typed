import type { Alt2 } from 'fp-ts/Alt'
import type { Alternative2 } from 'fp-ts/Alternative'
import type { Applicative } from 'fp-ts/Applicative'
import type { Bifunctor2 } from 'fp-ts/Bifunctor'
import type { Extend2 } from 'fp-ts/Extend'
import type { Foldable2 } from 'fp-ts/Foldable'
import { identity } from 'fp-ts/function'
import type { HKT } from 'fp-ts/HKT'
import type { Monad2 } from 'fp-ts/Monad'
import type { Monoid } from 'fp-ts/Monoid'
import { pipe, pipeable } from 'fp-ts/pipeable'
import type { Traversable2 } from 'fp-ts/Traversable'

import { ap } from './ap'
import { chain } from './chain'
import { getOrElse } from './getOrElse'
import { isRefreshingSuccess } from './isRefreshingSuccess'
import { isSuccess } from './isSuccess'
import { map } from './map'
import { mapLeft } from './mapLeft'
import { NoData, RemoteData } from './RemoteData'
import { Success } from './Success'

export const URI = '@typed/fp/RemoteData/exports'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  interface URItoKind2<E, A> {
    [URI]: RemoteData<E, A>
  }
}

/**
 * Monad, Foldable, Traverasble, Alt, Extend and Alternative instances for RemoteData.
 */
export const remoteData: Monad2<URI> &
  Foldable2<URI> &
  Traversable2<URI> &
  Bifunctor2<URI> &
  Alt2<URI> &
  Extend2<URI> &
  Alternative2<URI> = {
  URI,
  of: Success.of,
  ap: ap,
  map: (rd, f) => map(f, rd),
  mapLeft: (rd, f) => mapLeft(f, rd),
  bimap: (rd, f, g) => pipe(rd, mapLeft(f), map(g)),
  chain: (rd, f) => chain(f, rd),

  reduce: (rd, b, f) =>
    pipe(
      map((a) => f(b, a), rd),
      getOrElse(() => b),
    ),

  reduceRight: (rd, b, f) =>
    pipe(
      rd,
      map((a) => f(a, b)),
      getOrElse(() => b),
    ),

  foldMap: <M>(M: Monoid<M>) => <E, A>(rd: RemoteData<E, A>, f: (a: A) => M) =>
    pipe(
      rd,
      map(f),
      getOrElse(() => M.empty),
    ),

  traverse: <F>(F: Applicative<F>) => <E, A, B>(
    ta: RemoteData<E, A>,
    f: (a: A) => HKT<F, B>,
  ): HKT<F, RemoteData<E, B>> => {
    if (isSuccess(ta) || isRefreshingSuccess(ta)) {
      return F.map(f(ta.value), Success.of)
    }

    return F.of(ta)
  },

  sequence: <F>(F: Applicative<F>) => <A, B>(
    ta: RemoteData<A, HKT<F, B>>,
  ): HKT<F, RemoteData<A, B>> => remoteData.traverse(F)(ta, identity),

  alt: (fa, f) => {
    if (isSuccess(fa) || isRefreshingSuccess(fa)) {
      return fa
    }

    return f()
  },

  zero: <A, B>(): RemoteData<A, B> => NoData,

  extend: (rd, f) => {
    if (isSuccess(rd) || isRefreshingSuccess(rd)) {
      return Success.of(f(rd))
    }

    return rd
  },
}

export const {
  alt,
  apFirst,
  apSecond,
  bimap,
  chainFirst,
  duplicate,
  extend,
  flatten,
  foldMap,
  reduce,
  reduceRight,
} = pipeable(remoteData)
