import * as E from '@fp/Env'
import { Arity1, increment } from '@fp/function'
import { createRef, getRef, modifyRef_, Ref, Refs } from '@fp/Ref'

/**
 * Track Wins
 */
export const Wins: Ref<unknown, number> = createRef(E.of(0))

export const getWins: E.Env<Refs, number> = getRef(Wins)

export const modifyWins: (f: Arity1<number, number>) => E.Env<Refs, number> = modifyRef_(Wins)

export const won: E.Env<Refs, number> = modifyWins(increment)
