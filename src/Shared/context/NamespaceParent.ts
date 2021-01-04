import { Pure } from '@fp/Effect/exports'
import { createShared, getShared, Namespace, setShared } from '@fp/Shared/core/exports'
import { none, Option } from 'fp-ts/Option'

/**
 * Keep reference to the current namespace's parent, if any.
 */
export const NamespaceParent = createShared(
  Symbol.for('NamespaceParent'),
  Pure.fromIO((): Option<Namespace> => none),
)

/**
 * Get the current Namespace's parent
 */
export const getNamespaceParent = getShared(NamespaceParent)

/**
 * Set the current Namespace's parent
 */
export const setNamespaceParent = setShared(NamespaceParent)
