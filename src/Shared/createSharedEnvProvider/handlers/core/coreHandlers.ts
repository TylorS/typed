import { createSharedEventHandler } from '../../SharedEventHandler'
import { namespaceDeletedGuard } from '../guards'
import { namespaceDeleted } from './namspaceDeleted'

/**
 * The Shared handlers required for the core of Shared. It simply removes
 * resources it creates on your behalf. Feel free to otherwise replace this
 * with your own variant if you need.
 */
export const coreHandlers = [
  createSharedEventHandler(namespaceDeletedGuard, namespaceDeleted),
] as const
