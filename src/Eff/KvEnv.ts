import { DeleteKV2, GetKV2, SetKV2 } from '@typed/fp/KV'
import * as K from '@typed/fp/KvEnv'
import { WidenI } from '@typed/fp/Widen'

import { Eff } from './Eff'
import { Chain, FromIO, FromReader, MonadReader, ProvideSome, URI, UseSome } from './fp-ts'

export const sendSharedEvent: (
  event: K.KvEvent<URI>,
) => Eff<K.KvEnv<URI, any, any>, void> = K.createSendSharedEvent({
  ...FromReader,
  ...FromIO,
  ...Chain,
})

export const provideKV: <E, A>(
  hkt: Eff<WidenI<E | GetKV2<URI> | SetKV2<URI> | DeleteKV2<URI> | K.KvEnv<URI, any, any>>, A>,
) => Eff<WidenI<E | K.KvEnv<URI, any, any>>, any> = K.provideKV({
  ...MonadReader,
  ...FromIO,
  ...ProvideSome,
})

export const useKV: <E, A>(
  hkt: Eff<WidenI<E | GetKV2<URI> | SetKV2<URI> | DeleteKV2<URI> | K.KvEnv<URI, any, any>>, A>,
) => Eff<WidenI<E | K.KvEnv<URI, any, any>>, any> = K.useKV({
  ...MonadReader,
  ...FromIO,
  ...UseSome,
})
