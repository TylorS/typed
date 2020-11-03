import { Pure } from '@typed/fp/Effect/exports'
import { getShared, shared, SharedKey } from '@typed/fp/Shared/domain/exports'

import { State } from './State'

/**
 * Memoize the creation of State objects wrapping Shared value.
 */
export const SharedStates = shared(
  Symbol('SharedStates'),
  Pure.fromIO(() => new Map<SharedKey, State<any>>()),
)

export const getSharedStates = getShared(SharedStates)
