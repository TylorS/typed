import { ChainRec4 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as SRTE from 'fp-ts/StateReaderTaskEither'

import { Arity1 } from './function'
import { MonadRec4 } from './MonadRec'
import { Provide4, ProvideAll4, ProvideSome4, UseAll4, UseSome4 } from './Provide'

export const chainRec = <A, S, R, E, B>(
  f: Arity1<A, SRTE.StateReaderTaskEither<S, R, E, E.Either<A, B>>>,
) => (value: A): SRTE.StateReaderTaskEither<S, R, E, B> =>
  pipe(value, f, SRTE.chain(E.match(chainRec(f), SRTE.of)))

export const ChainRec: ChainRec4<SRTE.URI> = {
  chainRec,
}

export const MonadRec: MonadRec4<SRTE.URI> = {
  ...SRTE.Monad,
  chainRec,
}

export const useSome = <R1>(provided: R1) => <S, R2, E, A>(
  srte: SRTE.StateReaderTaskEither<S, R1 & R2, E, A>,
): SRTE.StateReaderTaskEither<S, R2, E, A> => (s) => (r) => srte(s)({ ...r, ...provided })

export const provideSome = <R1>(provided: R1) => <S, R2, E, A>(
  srte: SRTE.StateReaderTaskEither<S, R1 & R2, E, A>,
): SRTE.StateReaderTaskEither<S, R2, E, A> => (s) => (r) => srte(s)({ ...provided, ...r })

export const useAll = <R>(provided: R) => <S, E, A>(
  srte: SRTE.StateReaderTaskEither<S, R, E, A>,
): SRTE.StateReaderTaskEither<S, unknown, E, A> => (s) => () => srte(s)(provided)

export const provideAll = <R>(provided: R) => <S, E, A>(
  srte: SRTE.StateReaderTaskEither<S, R, E, A>,
): SRTE.StateReaderTaskEither<S, unknown, E, A> => (s) => (r) =>
  srte(s)({ ...provided, ...(r as {}) })

export const UseSome: UseSome4<SRTE.URI> = {
  useSome,
}

export const UseAll: UseAll4<SRTE.URI> = {
  useAll,
}

export const ProvideSome: ProvideSome4<SRTE.URI> = {
  provideSome,
}

export const ProvideAll: ProvideAll4<SRTE.URI> = {
  provideAll,
}

export const Provide: Provide4<SRTE.URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

export * from 'fp-ts/StateReaderTaskEither'
