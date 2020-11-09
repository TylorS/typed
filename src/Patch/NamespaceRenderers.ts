import { Pure } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import {
  addDisposable,
  createShared,
  getCurrentNamespace,
  getShared,
  Namespace,
} from '@typed/fp/Shared/core/exports'
import { usingGlobal } from '@typed/fp/Shared/global/exports'
import { pipe } from 'fp-ts/function'

export const NamespaceRenderers = createShared(
  Symbol.for('NamespaceRenderers'),
  Pure.fromIO(() => new Set<Namespace>()),
)

export const getNamespaceRenderers = pipe(NamespaceRenderers, getShared, usingGlobal)

export const addNamespaceRenderer = doEffect(function* () {
  const currentNamespace = yield* getCurrentNamespace
  const renderers = yield* getNamespaceRenderers

  if (renderers.has(currentNamespace)) {
    return
  }

  renderers.add(currentNamespace)

  yield* addDisposable({ dispose: () => renderers.delete(currentNamespace) })
})
