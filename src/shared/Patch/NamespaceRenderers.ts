import { Pure } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { pipe } from 'fp-ts/function'

import {
  addDisposable,
  createShared,
  getCurrentNamespace,
  getShared,
  Namespace,
} from '../core/exports'
import { usingGlobal } from '../global/exports'

export const NamespaceRenderers = createShared(
  Symbol('NamespaceRenderers'),
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
