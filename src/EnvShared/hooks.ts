import * as H from '@typed/fp/hooks'
import { MonadAsk, FromIO } from '@typed/fp/Env'

const env = { ...MonadAsk, ...FromIO }

export const getNextIndex = H.createGetNextIndex(env)()
export const getNextSymbol = H.createGetNextSymbol(env)()
export const resetIndex = H.createResetIndex(env)()

export const getSharedMap = H.createGetSharedMap(env)

export const useRef = H.createUseRef(env)
export const useState = H.createUseState(env)
