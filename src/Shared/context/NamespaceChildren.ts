import { doEffect, Pure } from '@fp/Effect/exports'
import { createShared, getShared, Namespace } from '@fp/Shared/core/exports'

/**
 * Keep track of all of the "child" namespaces in the tree of namespaces.
 */
export const NamespaceChildren = createShared(
  Symbol.for('NamespaceChildren'),
  Pure.fromIO((): Set<Namespace> => new Set()),
)

/**
 * Get the current namespace's children.
 */
export const getNamespaceChildren = getShared(NamespaceChildren)

/**
 * Add a namespace to the current namespace
 */
export const addChild = (child: Namespace) =>
  doEffect(function* () {
    const children = yield* getNamespaceChildren

    children.add(child)
  })

/**
 * Remove a namespace from the current namespace
 */
export const removeChild = (child: Namespace) =>
  doEffect(function* () {
    const children = yield* getNamespaceChildren

    children.delete(child)
  })
