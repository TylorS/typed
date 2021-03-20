import { DeleteKV2, GetKV2, SetKV2 } from '@typed/fp/KV'
import * as K from '@typed/fp/KvEnv'
import { WidenI } from '@typed/fp/Widen'
import { Chain, FromReader, Reader, URI } from 'fp-ts/dist/Reader'

import { FromIO } from './fromIO'
import { MonadReader } from './MonadReader'
import { ProvideSome, UseSome } from './provide'

export const sendSharedEvent: (
  event: K.KvEvent<URI>,
) => Reader<K.KvEnv<URI, any, any>, void> = K.createSendSharedEvent({
  ...FromReader,
  ...FromIO,
  ...Chain,
})

export const provideKV: <E, A>(
  hkt: Reader<WidenI<E | GetKV2<URI> | SetKV2<URI> | DeleteKV2<URI> | K.KvEnv<URI, any, any>>, A>,
) => Reader<WidenI<E | K.KvEnv<URI, any, any>>, any> = K.provideKV({
  ...MonadReader,
  ...FromIO,
  ...ProvideSome,
})

export const useKV: <E, A>(
  hkt: Reader<WidenI<E | GetKV2<URI> | SetKV2<URI> | DeleteKV2<URI> | K.KvEnv<URI, any, any>>, A>,
) => Reader<WidenI<E | K.KvEnv<URI, any, any>>, any> = K.useKV({
  ...MonadReader,
  ...FromIO,
  ...UseSome,
})
