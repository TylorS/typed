/**
 * @typed/fp/StateReaderTaskEither is an extension of fp-ts/StateReaderTaskEither with additional
 * type-class instances.
 * @since 0.9.2
 */
import { ChainRec4 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as SRTE from 'fp-ts/StateReaderTaskEither'

import { Arity1 } from './function'
import { MonadRec4 } from './MonadRec'
import { Provide4, ProvideAll4, ProvideSome4, UseAll4, UseSome4 } from './Provide'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, S, R, E, B>(f: Arity1<A, SRTE.StateReaderTaskEither<S, R, E, E.Either<A, B>>>) =>
  (value: A): SRTE.StateReaderTaskEither<S, R, E, B> =>
    pipe(value, f, SRTE.chain(E.match(chainRec(f), SRTE.of)))

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec4<SRTE.URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec4<SRTE.URI> = {
  ...SRTE.Monad,
  chainRec,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSome =
  <R1>(provided: R1) =>
  <S, R2, E, A>(
    srte: SRTE.StateReaderTaskEither<S, R1 & R2, E, A>,
  ): SRTE.StateReaderTaskEither<S, R2, E, A> =>
  (s) =>
  (r) =>
    srte(s)({ ...r, ...provided })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSome =
  <R1>(provided: R1) =>
  <S, R2, E, A>(
    srte: SRTE.StateReaderTaskEither<S, R1 & R2, E, A>,
  ): SRTE.StateReaderTaskEither<S, R2, E, A> =>
  (s) =>
  (r) =>
    srte(s)({ ...provided, ...r })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAll =
  <R>(provided: R) =>
  <S, E, A>(
    srte: SRTE.StateReaderTaskEither<S, R, E, A>,
  ): SRTE.StateReaderTaskEither<S, unknown, E, A> =>
  (s) =>
  () =>
    srte(s)(provided)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAll =
  <R>(provided: R) =>
  <S, E, A>(
    srte: SRTE.StateReaderTaskEither<S, R, E, A>,
  ): SRTE.StateReaderTaskEither<S, unknown, E, A> =>
  (s) =>
  (r) =>
    srte(s)({ ...provided, ...(r as {}) })

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: UseSome4<SRTE.URI> = {
  useSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: UseAll4<SRTE.URI> = {
  useAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: ProvideSome4<SRTE.URI> = {
  provideSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: ProvideAll4<SRTE.URI> = {
  provideAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: Provide4<SRTE.URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

export * from 'fp-ts/StateReaderTaskEither'
