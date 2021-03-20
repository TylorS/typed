import { DeleteKV2, GetKV2, SetKV2 } from '@typed/fp/KV'
import * as K from '@typed/fp/KvEnv'
import { WidenI } from '@typed/fp/Widen'

import { Eff } from './Eff'
import { Chain, FromIO, FromReader, MonadReader, URI, UseSome } from './fp-ts'

export const sendKvEvent: (
  event: K.KvEvent<URI>,
) => Eff<K.KvEnv<URI, any, any>, void> = K.createSendKvEvent({
  ...FromReader,
  ...FromIO,
  ...Chain,
})

export const useKV: <E, A>(
  hkt: Eff<WidenI<E | GetKV2<URI> | SetKV2<URI> | DeleteKV2<URI> | K.KvEnv<URI, any, any>>, A>,
) => Eff<WidenI<E | K.KvEnv<URI, any, any>>, any> = K.createUseKV({
  ...MonadReader,
  ...FromIO,
  ...UseSome,
})
