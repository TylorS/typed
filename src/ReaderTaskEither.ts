/**
 * @typed/fp/ReaderTaskEither is an extension of fp-ts/ReaderTaskEither with additional
 * type-class instances.
 * @since 0.9.2
 */
import { ChainRec3 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as RTE from 'fp-ts/ReaderTaskEither'

import { swapEithers } from './internal'
import { MonadRec3 } from './MonadRec'
import { Provide3, ProvideAll3, ProvideSome3, UseAll3, UseSome3 } from './Provide'
import * as RT from './ReaderTask'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, R, E, B>(f: (value: A) => RTE.ReaderTaskEither<R, E, E.Either<A, B>>) =>
  (value: A): RTE.ReaderTaskEither<R, E, B> =>
    pipe(
      value,
      RT.chainRec((a) => pipe(a, f, RT.map(swapEithers))),
    )

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec3<RTE.URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec3<RTE.URI> = {
  ...RTE.Monad,
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: UseSome3<RTE.URI> = {
  useSome: RT.useSome,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSome = UseSome.useSome

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: ProvideSome3<RTE.URI> = {
  provideSome: RT.provideSome,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSome = ProvideSome.provideSome

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: UseAll3<RTE.URI> = {
  useAll: RT.useAll,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAll = UseAll.useAll

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: ProvideAll3<RTE.URI> = {
  provideAll: RT.provideAll,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAll = ProvideAll.provideAll

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: Provide3<RTE.URI> = {
  ...UseSome,
  ...UseAll,
  ...ProvideSome,
  ...ProvideAll,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export * from 'fp-ts/ReaderTaskEither'
