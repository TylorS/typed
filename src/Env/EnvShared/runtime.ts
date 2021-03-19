import { Namespace } from '@typed/fp/Namespace'
import * as R from '@typed/fp/Shared/runtime'
import { CoreHandlers } from '@typed/fp/Shared/runtime'

import { FromIO, Functor, Monad, MonadReader, ProvideSome, URI, UseSome } from '../fp-ts'

const env = { ...MonadReader, ...FromIO }

export const coreHandlers: CoreHandlers<URI> = R.createCoreHandlers(MonadReader)

export const createDeleteShared = R.createDeleteShared(env)
export const createGetOrCreateNamespace = R.createGetOrCreateNamespace(env)
export const createGetOrInsert = R.createGetOrInsert(Monad)
export const createGetShared = R.createGetShared(env)
export const createSendSharedEvent = R.createSendSharedEvent(MonadReader)
export const createSetShared = R.createSetShared(env)

export const createRuntimeEnv = (namespace: Namespace) => R.createRuntimeEnv<URI>(namespace)
export const provideRuntime = R.provideRuntime({ ...env, ...ProvideSome })

export const usingGlobal = R.usingGlobal({ ...UseSome, ...Functor })
export const runWithNamespace = R.createRunWithNamespace(env)
