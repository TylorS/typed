import { Pure } from '@typed/fp/Effect/Effect'
import { getShared, Namespace, shared } from '@typed/fp/Shared/domain/exports'

export const NamespaceProviders = shared(
  Symbol('NamespaceProviders'),
  Pure.fromIO(() => new Set<Namespace>()),
)

export const getNamspaceProviders = getShared(NamespaceProviders)
