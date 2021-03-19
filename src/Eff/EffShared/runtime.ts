import { Namespace } from '@typed/fp/Namespace'
import * as R from '@typed/fp/Shared/runtime'
import { CoreHandlers } from '@typed/fp/Shared/runtime'

import { FromIO, Functor, Monad, MonadReader, ProvideSome, URI, UseSome } from '../fp-ts'

const eff = { ...MonadReader, ...FromIO }

export const coreHandlers: CoreHandlers<URI> = R.createCoreHandlers(MonadReader)

export const createDeleteShared = R.createDeleteShared(eff)
export const createGetOrCreateNamespace = R.createGetOrCreateNamespace(eff)
export const createGetOrInsert = R.createGetOrInsert(Monad)
export const createGetShared = R.createGetShared(eff)
export const createSendSharedEvent = R.createSendSharedEvent(MonadReader)
export const createSetShared = R.createSetShared(eff)

export const createRuntimeEnv = (namespace: Namespace) => R.createRuntimeEnv<URI>(namespace)
export const provideRuntime = R.provideRuntime({ ...eff, ...ProvideSome })

export const usingGlobal = R.usingGlobal({ ...UseSome, ...Functor })
export const runWithNamespace = R.createRunWithNamespace(eff)
