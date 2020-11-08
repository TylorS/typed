import { createSharedEventHandler } from '../../SharedEventHandler'
import { namespaceDeletedGuard } from '../guards'
import { namespaceDeleted } from './namspaceDeleted'

export const coreHandlers = [
  createSharedEventHandler(namespaceDeletedGuard, namespaceDeleted),
] as const
