import { Pure } from '@fp/Effect/exports'
import { createShared, getShared, SharedKey } from '@fp/Shared/core/exports'

import { State } from './State'

/**
 * Memoize the creation of State objects wrapping Shared value.
 */
export const SharedStates = createShared(
  Symbol.for('SharedStates'),
  Pure.fromIO(() => new Map<SharedKey, State<any>>()),
)

/**
 * Get Map of SharedStates
 */
export const getSharedStates = getShared(SharedStates)
