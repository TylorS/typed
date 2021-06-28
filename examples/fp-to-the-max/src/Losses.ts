import * as E from '@fp/Env'
import { flow, increment } from '@fp/function'
import * as Ref from '@fp/Ref'

/**
 * Track the number of losses
 */
export const Losses = Ref.create(E.of(0))

// Add one to the number of losses
export const lost: E.Env<Ref.Refs, number> = Losses.update(flow(increment, E.of))
