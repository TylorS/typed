import * as E from '@fp/Env'
import { increment } from '@fp/function'
import { createRef, getRef, modifyRef_ } from '@fp/Ref'

/**
 * Track the number of losses
 */
export const Losses = createRef(E.of(0))

// get the current value of Losses
export const getLosses = getRef(Losses)

// apply function to Losses reference
export const modifyLosses = modifyRef_(Losses)

// Add one to the number of losses
export const lost = modifyLosses(increment)
