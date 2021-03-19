import { usingGlobal as usingGlobal_ } from '@typed/fp/Global'
import { Namespace } from '@typed/fp/Namespace'
import * as S from '@typed/fp/Shared'
import { Functor, Monad, URI } from 'fp-ts/dist/Reader'

import { FromIO } from '../fromIO'
import { MonadReader } from '../MonadReader'
import { ProvideSome, UseSome } from '../provide'

const reader = { ...MonadReader, ...FromIO }

export const coreHandlers: S.CoreHandlers<URI> = S.createCoreHandlers(MonadReader)

export const createDeleteKv = S.createDeleteKV(reader)
export const createGetOrCreateNamespace = S.createGetOrCreateNamespace(reader)
export const createGetOrInsert = S.createGetOrInsert(Monad)
export const createGetKV = S.createGetKV(reader)
export const createSendSharedEvent = S.createSendSharedEvent(MonadReader)
export const createSetKV = S.createSetKV(reader)

export const createShared = (namespace: Namespace) => S.createShared<URI>(namespace)
export const provideShared = S.provideShared({ ...reader, ...ProvideSome })

export const usingGlobal = usingGlobal_({ ...UseSome, ...Functor })
export const runWithNamespace = S.createRunWithNamespace(reader)
