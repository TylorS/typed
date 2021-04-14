import * as E from '@fp/Env'
import { Arity1, increment } from '@fp/function'
import { createRef, getRef, modifyRef, Ref, Refs } from '@fp/Ref'

/**
 * Track Wins
 */
export const Wins: Ref<unknown, number> = createRef(E.of(0))

// Get the current Wins value
export const getWins: E.Env<Refs, number> = getRef(Wins)

// Update Wins value
export const modifyWins: (f: Arity1<number, number>) => E.Env<Refs, number> = modifyRef(Wins)

// Increment wins by 1
export const won: E.Env<Refs, number> = modifyWins(increment)
