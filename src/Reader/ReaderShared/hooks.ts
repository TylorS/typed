import * as H from '@typed/fp/hooks'
import { URI } from 'fp-ts/dist/Reader'

import { MonadAsk } from '../ask'
import { FromIO } from '../fromIO'
import { UseSome } from '../provide'

const reader = { ...MonadAsk, ...FromIO }

export const getNextIndex = H.createGetNextIndex(reader)()
export const getNextSymbol = H.createGetNextSymbol(reader)()
export const resetIndex = H.createResetIndex(reader)()

export const getSharedState = H.createGetSharedState(reader)

export const useRef = H.createUseRef(reader)
export const useState = H.createUseState(reader)

export const NamespaceDisposable = H.createNamespaceDisposable(FromIO)
export const hooksHandlers: H.HooksHandlers<URI> = H.createHooksHandlers({ ...reader, ...UseSome })
