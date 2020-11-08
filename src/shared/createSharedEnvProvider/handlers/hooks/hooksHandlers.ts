import { createSharedEventHandler } from '../../SharedEventHandler'
import { namespaceStartedGuard } from '../guards'
import { namespaceStarted } from './namespaceStarted'

export const hooksHandlers = [
  createSharedEventHandler(namespaceStartedGuard, namespaceStarted),
] as const
