import { createSharedEventHandler } from '../../SharedEventHandler'
import { namespaceStartedGuard } from '../guards'
import { namespaceStarted } from './namespaceStarted'

/**
 * All of the Shared handlers required to provide a React hooks-like API.
 */
export const hooksHandlers = [
  createSharedEventHandler(namespaceStartedGuard, namespaceStarted),
] as const
