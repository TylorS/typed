import { MonadReader2 } from '@typed/fp/MonadReader'
import { FromReader, Monad, URI } from 'fp-ts/dist/Reader'

export const MonadReader: MonadReader2<URI> = {
  ...Monad,
  ...FromReader,
}
