import { Pure } from '@fp/Effect/Effect'
import { doEffect } from '@fp/Effect/exports'
import {
  addDisposable,
  createShared,
  getCurrentNamespace,
  getShared,
  Namespace,
} from '@fp/Shared/core/exports'
import { usingGlobal } from '@fp/Shared/global/exports'
import { pipe } from 'fp-ts/function'

/**
 * Namespaces that are being used that can be patched directly.
 */
export const NamespaceRenderers = createShared(
  Symbol.for('NamespaceRenderers'),
  Pure.fromIO(() => new Set<Namespace>()),
)

/**
 * Get the Set of NamespaceRenderers
 */
export const getNamespaceRenderers = pipe(NamespaceRenderers, getShared, usingGlobal)

/**
 * Mark the current namespace
 */
export const addNamespaceRenderer = doEffect(function* () {
  const currentNamespace = yield* getCurrentNamespace
  const renderers = yield* getNamespaceRenderers

  if (renderers.has(currentNamespace)) {
    return
  }

  renderers.add(currentNamespace)

  yield* addDisposable({ dispose: () => renderers.delete(currentNamespace) })
})
