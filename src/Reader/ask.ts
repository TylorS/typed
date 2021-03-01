import { Ask2 } from '@typed/fp/Ask'
import { MonadAsk2 } from '@typed/fp/MonadAsk'
import { ask, Monad, URI } from 'fp-ts/dist/Reader'

export const Ask: Ask2<URI> = {
  ask,
}

export const MonadAsk: MonadAsk2<URI> = {
  ...Monad,
  ask,
}
