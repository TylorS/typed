import { FromIO, Functor, Monad, MonadAsk, URI, UseSome } from '@typed/fp/Env'
import { Namespace } from '@typed/fp/Namespace'
import * as R from '@typed/fp/Shared/runtime'

const env = { ...MonadAsk, ...FromIO, ...UseSome }

export const createDeleteShared = R.createDeleteShared(env)
export const createGetOrCreateNamespace = R.createGetOrCreateNamespace({ ...MonadAsk, ...FromIO })
export const createGetOrInsert = R.createGetOrInsert(Monad)
export const createGetShared = R.createGetShared(env)
export const createSendSharedEvent = R.createSendSharedEvent(MonadAsk)
export const createSetShared = R.createSetShared(env)

export const createRuntimeEnv = (namespace: Namespace) => R.createRuntimeEnv<URI>(namespace)
export const provideRuntime = R.provideRuntime(env)

export const usingGlobal = R.usingGlobal({ ...UseSome, ...Functor })
