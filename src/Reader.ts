/**
 * @typed/fp/Reader is an extension to fp-ts/Reader with ChainRec + MonadRec instances.
 *
 * @since 0.9.2
 */
import { ChainRec2, tailRec } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import * as R from 'fp-ts/Reader'

import { pipe } from './function'
import { MonadRec2 } from './MonadRec'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from './Provide'

export * from 'fp-ts/Reader'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, R, B>(f: (value: A) => R.Reader<R, E.Either<A, B>>) =>
  (value: A): R.Reader<R, B> =>
  (r) =>
    pipe(
      value,
      tailRec((a: A) => f(a)(r)),
    )

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec2<R.URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec2<R.URI> = {
  ...R.Monad,
  chainRec,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSome =
  <R1>(provided: R1) =>
  <R2, A>(reader: R.Reader<R1 & R2, A>): R.Reader<R2, A> =>
  (e) =>
    reader({ ...e, ...provided })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSome =
  <R1>(provided: R1) =>
  <R2, A>(reader: R.Reader<R1 & R2, A>): R.Reader<R2, A> =>
  (e) =>
    reader({ ...provided, ...e })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAll =
  <R1>(provided: R1) =>
  <A>(reader: R.Reader<R1, A>): R.Reader<unknown, A> =>
  () =>
    reader(provided)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAll =
  <R1>(provided: R1) =>
  <A>(reader: R.Reader<R1, A>): R.Reader<unknown, A> =>
  (e) =>
    reader({ ...provided, ...((e as any) ?? {}) })

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: UseSome2<R.URI> = {
  useSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: UseAll2<R.URI> = {
  useAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: ProvideSome2<R.URI> = {
  provideSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: ProvideAll2<R.URI> = {
  provideAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: Provide2<R.URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
