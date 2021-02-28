import { MonadRec2 } from '@typed/fp/MonadRec'
import { ChainRec, Monad, URI as EitherURI } from 'fp-ts/dist/Either'

export const MonadRec: MonadRec2<EitherURI> = {
  ...Monad,
  ...ChainRec,
}
