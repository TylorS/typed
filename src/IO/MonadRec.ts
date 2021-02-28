import { MonadRec1 } from '@typed/fp/MonadRec'
import { ChainRec, Monad, URI as IoUri } from 'fp-ts/dist/IO'

export const MonadRec: MonadRec1<IoUri> = {
  ...Monad,
  ...ChainRec,
}
