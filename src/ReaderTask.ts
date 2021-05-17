import { ChainRec2 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as RT from 'fp-ts/ReaderTask'

import { MonadRec2 } from './MonadRec'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from './Provide'

export const chainRec =
  <A, R, B>(f: (value: A) => RT.ReaderTask<R, E.Either<A, B>>) =>
  (value: A): RT.ReaderTask<R, B> =>
    pipe(value, f, RT.chain(E.match(chainRec(f), RT.of))) // Recursion is okay because promise is always async

export const ChainRec: ChainRec2<RT.URI> = {
  chainRec,
}

export const MonadRec: MonadRec2<RT.URI> = {
  ...RT.Monad,
  chainRec,
}

export const useSome =
  <R1>(provided: R1) =>
  <R2, A>(readerTask: RT.ReaderTask<R1 & R2, A>): RT.ReaderTask<R2, A> =>
  (r) =>
    readerTask({ ...r, ...provided })

export const provideSome =
  <R1>(provided: R1) =>
  <R2, A>(readerTask: RT.ReaderTask<R1 & R2, A>): RT.ReaderTask<R2, A> =>
  (r) =>
    readerTask({ ...provided, ...r })

export const useAll =
  <R1>(provided: R1) =>
  <A>(readerTask: RT.ReaderTask<R1, A>): RT.ReaderTask<unknown, A> =>
  () =>
    readerTask(provided)

export const provideAll =
  <R1>(provided: R1) =>
  <A>(readerTask: RT.ReaderTask<R1, A>): RT.ReaderTask<unknown, A> =>
  (r) =>
    readerTask({ ...provided, ...(r as {}) })

export const UseSome: UseSome2<RT.URI> = {
  useSome,
}

export const UseAll: UseAll2<RT.URI> = {
  useAll,
}

export const ProvideSome: ProvideSome2<RT.URI> = {
  provideSome,
}

export const ProvideAll: ProvideAll2<RT.URI> = {
  provideAll,
}

export const Provide: Provide2<RT.URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

export * from 'fp-ts/ReaderTask'
