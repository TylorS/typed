import * as H from '@typed/fp/hooks'
import { FromIO, MonadAsk, URI, UseSome } from '@typed/fp/Reader'

const reader = { ...MonadAsk, ...FromIO }

export const getNextIndex = H.createGetNextIndex(reader)()
export const getNextSymbol = H.createGetNextSymbol(reader)()
export const resetIndex = H.createResetIndex(reader)()

export const getSharedState = H.createGetSharedState(reader)

export const useRef = H.createUseRef(reader)
export const useState = H.createUseState(reader)

export const NamespaceDisposable = H.createNamespaceDisposable(FromIO)
export const hooksHandlers: H.HooksHandlers<URI> = H.createHooksHandlers({ ...reader, ...UseSome })
