/**
 * @typed/fp/ReaderEither is an extension of fp-ts/ReaderEither
 *
 * @since 0.9.2
 */
import { ChainRec3 } from 'fp-ts/ChainRec'
import { Either } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as RE from 'fp-ts/ReaderEither'

import { swapEithers } from './internal'
import { MonadRec3 } from './MonadRec'
import { Provide3, ProvideAll3, ProvideSome3, UseAll3, UseSome3 } from './Provide'
import * as R from './Reader'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, R, E, B>(f: (a: A) => RE.ReaderEither<R, E, Either<A, B>>) =>
  (value: A): RE.ReaderEither<R, E, B> =>
    pipe(
      value,
      R.chainRec((a) => pipe(a, f, R.map(swapEithers))),
    )

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec3<RE.URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec3<RE.URI> = {
  ...RE.Monad,
  chainRec,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSome =
  <R1>(provided: R1) =>
  <R2, E, A>(reader: RE.ReaderEither<R1 & R2, E, A>): RE.ReaderEither<R2, E, A> =>
  (e) =>
    reader({ ...e, ...provided })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSome =
  <R1>(provided: R1) =>
  <R2, E, A>(reader: RE.ReaderEither<R1 & R2, E, A>): RE.ReaderEither<R2, E, A> =>
  (e) =>
    reader({ ...provided, ...e })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAll =
  <R1>(provided: R1) =>
  <E, A>(reader: RE.ReaderEither<R1, E, A>): RE.ReaderEither<unknown, E, A> =>
  () =>
    reader(provided)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAll =
  <R1>(provided: R1) =>
  <E, A>(reader: RE.ReaderEither<R1, E, A>): RE.ReaderEither<unknown, E, A> =>
  (e) =>
    reader({ ...provided, ...((e as any) ?? {}) })

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: UseSome3<RE.URI> = {
  useSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: UseAll3<RE.URI> = {
  useAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: ProvideSome3<RE.URI> = {
  provideSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: ProvideAll3<RE.URI> = {
  provideAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: Provide3<RE.URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

export * from 'fp-ts/ReaderEither'
