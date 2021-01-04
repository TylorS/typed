import { Pure } from '@fp/Effect/exports'
import { createShared, getShared } from '@fp/Shared/core/exports'

/**
 * Keep track of a Map of positions to symbols to ensure
 * hooks never conflict with user-land code.
 */
export const NamespaceSymbols = createShared(
  Symbol.for('NamespaceSymbols'),
  Pure.fromIO(() => new Map<number, symbol>()),
)

/**
 * Get NamespaceSymbols map.
 */
export const getNamespaceSymbols = getShared(NamespaceSymbols)
