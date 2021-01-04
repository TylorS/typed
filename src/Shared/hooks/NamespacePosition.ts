import { Pure } from '@fp/Effect/Effect'
import { createShared, getShared } from '@fp/Shared/core/exports'

import { createRef } from '../Ref/Ref'

/**
 * Keep track of the current hook's position
 */
export const NamespacePosition = createShared(
  Symbol.for('NamespacePositions'),
  Pure.fromIO(() => createRef(0)),
)

/**
 * Get the current hook position.
 */
export const getNamespacePosition = getShared(NamespacePosition)
