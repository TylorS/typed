import * as E from '@fp/Env'
import { Arity1, increment } from '@fp/function'
import { createRef, getRef, modifyRef_, Ref, Refs } from '@fp/Ref'

/**
 * Track the number of losses
 */
export const Losses: Ref<unknown, number> = createRef(E.of(0))

// get the current value of Losses
export const getLosses: E.Env<Refs, number> = getRef(Losses)

// apply function to Losses reference
export const modifyLosses: (f: Arity1<number, number>) => E.Env<Refs, number> = modifyRef_(Losses)

// Add one to the number of losses
export const lost: E.Env<Refs, number> = modifyLosses(increment)
