import { Pure } from '@typed/fp/Effect/Effect'
import { createShared, getShared, Namespace } from '@typed/fp/Shared/core/exports'

export const NamespaceProviders = createShared(
  Symbol.for('NamespaceProviders'),
  Pure.fromIO(() => new Set<Namespace>()),
)

export const getNamspaceProviders = getShared(NamespaceProviders)
