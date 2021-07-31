/**
 * @typed/fp/ReaderTask is an extension of fp-ts/ReaderTask with additional
 * type-class instances.
 * @since 0.9.2
 */
import { ChainRec2 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as RT from 'fp-ts/ReaderTask'

import { MonadRec2 } from './MonadRec'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from './Provide'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, R, B>(f: (value: A) => RT.ReaderTask<R, E.Either<A, B>>) =>
  (value: A): RT.ReaderTask<R, B> =>
    pipe(value, f, RT.chain(E.match(chainRec(f), RT.of))) // Recursion is okay because promise is always async

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec2<RT.URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec2<RT.URI> = {
  ...RT.Monad,
  chainRec,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSome =
  <R1>(provided: R1) =>
  <R2, A>(readerTask: RT.ReaderTask<R1 & R2, A>): RT.ReaderTask<R2, A> =>
  (r) =>
    readerTask({ ...r, ...provided })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSome =
  <R1>(provided: R1) =>
  <R2, A>(readerTask: RT.ReaderTask<R1 & R2, A>): RT.ReaderTask<R2, A> =>
  (r) =>
    readerTask({ ...provided, ...r })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAll =
  <R1>(provided: R1) =>
  <A>(readerTask: RT.ReaderTask<R1, A>): RT.ReaderTask<unknown, A> =>
  () =>
    readerTask(provided)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAll =
  <R1>(provided: R1) =>
  <A>(readerTask: RT.ReaderTask<R1, A>): RT.ReaderTask<unknown, A> =>
  (r) =>
    readerTask({ ...provided, ...(r as {}) })

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: UseSome2<RT.URI> = {
  useSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: UseAll2<RT.URI> = {
  useAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: ProvideSome2<RT.URI> = {
  provideSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: ProvideAll2<RT.URI> = {
  provideAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: Provide2<RT.URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

export * from 'fp-ts/ReaderTask'
