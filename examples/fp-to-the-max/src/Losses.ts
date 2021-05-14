import * as E from '@fp/Env'
import { increment } from '@fp/function'
import { createRef, Refs } from '@fp/Ref'

/**
 * Track the number of losses
 */
export const Losses = createRef(E.of(0))

// Add one to the number of losses
export const lost: E.Env<Refs, number> = Losses.modify(increment)
