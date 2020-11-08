import { Pure } from '@typed/fp/Effect/exports'
import { createShared, getShared } from '@typed/fp/Shared/core/exports'

export const NamespaceSymbols = createShared(
  Symbol('NamespaceSymbols'),
  Pure.fromIO(() => new Map<number, symbol>()),
)

export const getNamespaceSymbols = getShared(NamespaceSymbols)
