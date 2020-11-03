import { Pure } from '@typed/fp/Effect/exports'
import { getShared, shared } from '@typed/fp/Shared/domain/exports'

export const NamespaceSymbols = shared(
  Symbol('NamespaceSymbols'),
  Pure.fromIO(() => new Map<number, symbol>()),
)

export const getNamespaceSymbols = getShared(NamespaceSymbols)
