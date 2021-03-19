import * as H from '@typed/fp/hooks'
import { URI } from 'fp-ts/dist/Reader'

import { FromIO } from '../fromIO'
import { MonadReader } from '../MonadReader'
import { UseSome } from '../provide'

const reader = { ...MonadReader, ...FromIO }

export const getNextIndex = H.createGetNextIndex(reader)()
export const getNextSymbol = H.createGetNextSymbol(reader)()
export const resetIndex = H.createResetIndex(reader)()

export const getKVState = H.createGetKVState(reader)

export const useRef = H.createUseRef(reader)
export const useState = H.createUseState(reader)

export const NamespaceDisposable = H.createNamespaceDisposable(FromIO)
export const hooksHandlers: H.HooksHandlers<URI> = H.createHooksHandlers({ ...reader, ...UseSome })
