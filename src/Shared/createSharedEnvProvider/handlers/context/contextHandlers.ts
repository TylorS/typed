import { createSharedEventHandler } from '../../SharedEventHandler'
import {
  namespaceDeletedGuard,
  namespaceStartedGuard,
  sharedValueDeletedGuard,
  sharedValueUpdatedGuard,
} from '../guards'
import { namespaceDeleted } from './namespaceDeleted'
import { namespaceStarted } from './namespaceStarted'
import { sharedValueDeleted } from './sharedValueDeleted'
import { sharedValueUpdated } from './sharedValueUpdated'

/**
 * All of the Shared handlers required to power the React Context-like API for
 * Shared.
 */
export const contextHandlers = [
  createSharedEventHandler(namespaceDeletedGuard, namespaceDeleted),
  createSharedEventHandler(namespaceStartedGuard, namespaceStarted),
  createSharedEventHandler(sharedValueDeletedGuard, sharedValueDeleted),
  createSharedEventHandler(sharedValueUpdatedGuard, sharedValueUpdated),
] as const
