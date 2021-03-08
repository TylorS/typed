import * as H from '@typed/fp/hooks'
import { MonadAsk, FromIO, UseSome } from '@typed/fp/Env'

const env = { ...MonadAsk, ...FromIO, ...UseSome }

export const createGetNextIndex = H.createGetNextIndex(env)
export const createGetNextSymbol = H.createGetNextSymbol(env)
export const createResetIndex = H.createResetIndex(env)

export const getSharedMap = H.createGetSharedMap(env)
export const useRef = H.createUseRef(env)
export const useState = H.createUseState(env)
