/**
 * @typed/fp/State is an extension of fp-ts/State with additional
 * type-class instances.
 * @since 0.9.2
 */
import { ChainRec2 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import * as S from 'fp-ts/State'

import { MonadRec2 } from './MonadRec'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, S, B>(f: (value: A) => S.State<S, E.Either<A, B>>) =>
  (value: A): S.State<S, B> =>
  (s) => {
    let result = f(value)(s)

    while (E.isLeft(result[0])) {
      result = f(value)(result[1])
    }

    return [result[0].right, result[1]]
  }

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec2<S.URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec2<S.URI> = {
  ...S.Monad,
  chainRec,
}

export * from 'fp-ts/State'
