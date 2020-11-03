import { Pure } from '@typed/fp/Effect/Effect'
import { getShared, shared } from '@typed/fp/Shared/domain/exports'

export const NamespacePosition = shared(Symbol('NamespacePositions'), Pure.of(0))

export const getNamespacePosition = getShared(NamespacePosition)
