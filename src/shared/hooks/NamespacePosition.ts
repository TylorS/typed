import { Pure } from '@typed/fp/Effect/Effect'
import { createShared, getShared } from '@typed/fp/shared/core/exports'

export const NamespacePosition = createShared(Symbol('NamespacePositions'), Pure.of(0))

export const getNamespacePosition = getShared(NamespacePosition)
