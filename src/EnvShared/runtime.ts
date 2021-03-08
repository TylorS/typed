import { FromIO, Functor, Monad, MonadAsk, ProvideSome, URI, UseSome } from '@typed/fp/Env'
import { Namespace } from '@typed/fp/Namespace'
import * as R from '@typed/fp/Shared/runtime'

const env = { ...MonadAsk, ...FromIO }

export const coreHandlers: readonly [
  R.RuntimeHandler<URI, R.NamespaceDeleted>,
] = R.createCoreHandlers(MonadAsk)

export const createDeleteShared = R.createDeleteShared(env)
export const createGetOrCreateNamespace = R.createGetOrCreateNamespace(env)
export const createGetOrInsert = R.createGetOrInsert(Monad)
export const createGetShared = R.createGetShared(env)
export const createSendSharedEvent = R.createSendSharedEvent(MonadAsk)
export const createSetShared = R.createSetShared(env)

export const createRuntimeEnv = (namespace: Namespace) => R.createRuntimeEnv<URI>(namespace)
export const provideRuntime = R.provideRuntime({ ...env, ...ProvideSome })

export const usingGlobal = R.usingGlobal({ ...UseSome, ...Functor })
