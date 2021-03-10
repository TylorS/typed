import { Namespace } from '@typed/fp/Namespace'
import * as R from '@typed/fp/Shared/runtime'
import { CoreHandlers } from '@typed/fp/Shared/runtime'
import { Functor, Monad, URI } from 'fp-ts/dist/Reader'

import { MonadAsk } from '../ask'
import { FromIO } from '../fromIO'
import { ProvideSome, UseSome } from '../provide'

const reader = { ...MonadAsk, ...FromIO }

export const coreHandlers: CoreHandlers<URI> = R.createCoreHandlers(MonadAsk)

export const createDeleteShared = R.createDeleteShared(reader)
export const createGetOrCreateNamespace = R.createGetOrCreateNamespace(reader)
export const createGetOrInsert = R.createGetOrInsert(Monad)
export const createGetShared = R.createGetShared(reader)
export const createSendSharedEvent = R.createSendSharedEvent(MonadAsk)
export const createSetShared = R.createSetShared(reader)

export const createRuntimeEnv = (namespace: Namespace) => R.createRuntimeEnv<URI>(namespace)
export const provideRuntime = R.provideRuntime({ ...reader, ...ProvideSome })

export const usingGlobal = R.usingGlobal({ ...UseSome, ...Functor })
export const runWithNamespace = R.createRunWithNamespace(reader)
