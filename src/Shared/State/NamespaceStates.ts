import { Pure } from '@typed/fp/Effect/exports'
import { createShared, getShared, SharedKey } from '@typed/fp/Shared/core/exports'

import { State } from './State'

/**
 * Memoize the creation of State objects wrapping Shared value.
 */
export const SharedStates = createShared(
  Symbol.for('SharedStates'),
  Pure.fromIO(() => new Map<SharedKey, State<any>>()),
)

export const getSharedStates = getShared(SharedStates)
