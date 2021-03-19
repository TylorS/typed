import * as H from '@typed/fp/hooks'

import { FromIO, MonadReader, URI, UseSome } from '../fp-ts'

const eff = { ...MonadReader, ...FromIO }

export const getNextIndex = H.createGetNextIndex(eff)()
export const getNextSymbol = H.createGetNextSymbol(eff)()
export const resetIndex = H.createResetIndex(eff)()

export const getKVState = H.createGetKVState(eff)

export const useRef = H.createUseRef(eff)
export const useState = H.createUseState(eff)

export const NamespaceDisposable = H.createNamespaceDisposable(FromIO)
export const hooksHandlers: H.HooksHandlers<URI> = H.createHooksHandlers({ ...eff, ...UseSome })
