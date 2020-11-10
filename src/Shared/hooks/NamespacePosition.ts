import { Pure } from '@typed/fp/Effect/Effect'
import { createShared, getShared } from '@typed/fp/Shared/core/exports'

import { createRef } from '../Ref/Ref'

export const NamespacePosition = createShared(
  Symbol.for('NamespacePositions'),
  Pure.fromIO(() => createRef(0)),
)

export const getNamespacePosition = getShared(NamespacePosition)
