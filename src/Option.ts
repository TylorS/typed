/**
 * @typed/fp/Option is an extension to fp-ts/Option with stack-safe
 * ChainRec + MonadRec instances.
 * @since 0.9.2
 */
import { ChainRec1 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'

import { MonadRec1 } from './MonadRec'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, B>(f: (value: A) => O.Option<E.Either<A, B>>) =>
  (value: A): O.Option<B> => {
    let option = f(value)

    while (O.isSome(option)) {
      if (E.isRight(option.value)) {
        return O.some(option.value.right)
      }

      option = f(option.value.left)
    }

    return option
  }

/**
 * @since 0.9.2
 * @category Typeclass
 */
export const ChainRec: ChainRec1<O.URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export const MonadRec: MonadRec1<O.URI> = {
  ...O.Monad,
  ...ChainRec,
}

export * from 'fp-ts/Option'
