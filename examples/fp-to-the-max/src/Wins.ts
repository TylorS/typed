import * as E from '@fp/Env'
import { increment } from '@fp/function'
import { createRef, getRef, modifyRef_ } from '@fp/Ref'

/**
 * Track Wins
 */
export const Wins = createRef(E.of(0))

export const getWins = getRef(Wins)

export const modifyWins = modifyRef_(Wins)

export const won = modifyWins(increment)
