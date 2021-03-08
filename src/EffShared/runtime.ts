import { FromIO, Functor, Monad, MonadAsk, ProvideSome, URI, UseSome } from '@typed/fp/Eff'
import { Namespace } from '@typed/fp/Namespace'
import * as R from '@typed/fp/Shared/runtime'

const eff = { ...MonadAsk, ...FromIO }

export const coreHandlers: readonly [
  R.RuntimeHandler<URI, R.NamespaceDeleted>,
] = R.createCoreHandlers(MonadAsk)

export const createDeleteShared = R.createDeleteShared(eff)
export const createGetOrCreateNamespace = R.createGetOrCreateNamespace(eff)
export const createGetOrInsert = R.createGetOrInsert(Monad)
export const createGetShared = R.createGetShared(eff)
export const createSendSharedEvent = R.createSendSharedEvent(MonadAsk)
export const createSetShared = R.createSetShared(eff)

export const createRuntimeEnv = (namespace: Namespace) => R.createRuntimeEnv<URI>(namespace)
export const provideRuntime = R.provideRuntime({ ...eff, ...ProvideSome })

export const usingGlobal = R.usingGlobal({ ...UseSome, ...Functor })
