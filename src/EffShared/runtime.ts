import { FromIO, Functor, Monad, MonadAsk, URI, UseSome } from '@typed/fp/Eff'
import { Namespace } from '@typed/fp/Namespace'
import * as R from '@typed/fp/Shared/runtime'

const eff = { ...MonadAsk, ...FromIO, ...UseSome }

export const createDeleteShared = R.createDeleteShared(eff)
export const createGetOrCreateNamespace = R.createGetOrCreateNamespace({ ...MonadAsk, ...FromIO })
export const createGetOrInsert = R.createGetOrInsert(Monad)
export const createGetShared = R.createGetShared(eff)
export const createSendSharedEvent = R.createSendSharedEvent(MonadAsk)
export const createSetShared = R.createSetShared(eff)

export const createRuntimeEnv = (namespace: Namespace) => R.createRuntimeEnv<URI>(namespace)
export const provideRuntime = R.provideRuntime(eff)

export const usingGlobal = R.usingGlobal({ ...UseSome, ...Functor })
