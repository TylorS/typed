import { FromIO, MonadAsk, URI, UseSome } from '@typed/fp/Eff'
import * as H from '@typed/fp/hooks'

const eff = { ...MonadAsk, ...FromIO }

export const getNextIndex = H.createGetNextIndex(eff)()
export const getNextSymbol = H.createGetNextSymbol(eff)()
export const resetIndex = H.createResetIndex(eff)()

export const getSharedState = H.createGetSharedState(eff)

export const useRef = H.createUseRef(eff)
export const useState = H.createUseState(eff)

export const NamespaceDisposable = H.createNamespaceDisposable(FromIO)
export const hooksHandlers: H.HooksHandlers<URI> = H.createHooksHandlers({ ...eff, ...UseSome })
