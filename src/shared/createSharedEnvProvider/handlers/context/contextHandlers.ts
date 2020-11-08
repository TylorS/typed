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

export const contextHandlers = [
  createSharedEventHandler(namespaceDeletedGuard, namespaceDeleted),
  createSharedEventHandler(namespaceStartedGuard, namespaceStarted),
  createSharedEventHandler(sharedValueDeletedGuard, sharedValueDeleted),
  createSharedEventHandler(sharedValueUpdatedGuard, sharedValueUpdated),
] as const
