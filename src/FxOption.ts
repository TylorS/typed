import { ChainRec1 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'

import * as FxT from './FxT'
import { MonadRec1 } from './MonadRec'

export const chainRec = <A, B>(f: (value: A) => O.Option<E.Either<A, B>>) => (
  value: A,
): O.Option<B> => {
  let option = f(value)

  while (O.isSome(option)) {
    if (E.isRight(option.value)) {
      return O.some(option.value.right)
    }

    option = f(option.value.left)
  }

  return option
}

export const ChainRec: ChainRec1<O.URI> = {
  chainRec,
}

export const MonadRec: MonadRec1<O.URI> = {
  ...O.Monad,
  ...ChainRec,
}

export const ap = FxT.ap({ ...O.Monad, ...ChainRec, ...O.Apply })
export const chain = FxT.chain<O.URI>()
export const doOption = FxT.getDo<O.URI>()
export const liftOption = FxT.liftFx<O.URI>()
export const map = FxT.map<O.URI>()
export const toOption = FxT.toMonad<O.URI>({ ...O.Monad, ...ChainRec })
