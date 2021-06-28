import * as E from '@fp/Env'
import { flow, increment } from '@fp/function'
import * as Ref from '@fp/Ref'

/**
 * Track Wins
 */
export const Wins = Ref.create(E.of(0))

// Increment wins by 1
export const won: E.Env<Ref.Refs, number> = Wins.update(flow(increment, E.of))
