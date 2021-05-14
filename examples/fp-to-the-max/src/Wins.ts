import * as E from '@fp/Env'
import { increment } from '@fp/function'
import { createRef, Refs } from '@fp/Ref'

/**
 * Track Wins
 */
export const Wins = createRef(E.of(0))

// Increment wins by 1
export const won: E.Env<Refs, number> = Wins.modify(increment)
