import { DeleteKV2, GetKV2, SetKV2 } from '@typed/fp/KV'
import * as K from '@typed/fp/KvEnv'
import { WidenI } from '@typed/fp/Widen'
import { Chain, FromReader, Reader, URI } from 'fp-ts/dist/Reader'

import { FromIO } from './fromIO'
import { MonadReader } from './MonadReader'
import { UseSome } from './provide'

export const sendKvEvent: (
  event: K.KvEvent<URI>,
) => Reader<K.KvEnv<URI, unknown, unknown>, void> = K.createSendKvEvent({
  ...FromReader,
  ...FromIO,
  ...Chain,
})

export const useKV: <E, A>(
  hkt: Reader<
    WidenI<E | GetKV2<URI> | SetKV2<URI> | DeleteKV2<URI> | K.KvEnv<URI, unknown, unknown>>,
    A
  >,
) => Reader<WidenI<E | K.KvEnv<URI, unknown, unknown>>, A> = K.createUseKV({
  ...MonadReader,
  ...FromIO,
  ...UseSome,
})
