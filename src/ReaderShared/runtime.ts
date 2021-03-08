import { FromIO, Functor, Monad, MonadAsk, ProvideSome, URI, UseSome } from '@typed/fp/Reader'
import { Namespace } from '@typed/fp/Namespace'
import * as R from '@typed/fp/Shared/runtime'

const reader = { ...MonadAsk, ...FromIO }

export const createDeleteShared = R.createDeleteShared(reader)
export const createGetOrCreateNamespace = R.createGetOrCreateNamespace(reader)
export const createGetOrInsert = R.createGetOrInsert(Monad)
export const createGetShared = R.createGetShared(reader)
export const createSendSharedEvent = R.createSendSharedEvent(MonadAsk)
export const createSetShared = R.createSetShared(reader)

export const createRuntimeEnv = (namespace: Namespace) => R.createRuntimeEnv<URI>(namespace)
export const provideRuntime = R.provideRuntime({ ...reader, ...ProvideSome })

export const usingGlobal = R.usingGlobal({ ...UseSome, ...Functor })
