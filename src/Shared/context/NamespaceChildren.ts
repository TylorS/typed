import { doEffect, Pure } from '@typed/fp/Effect/exports'
import { createShared, getShared, Namespace } from '@typed/fp/Shared/core/exports'

export const NamespaceChildren = createShared(
  Symbol.for('NamespaceChildren'),
  Pure.fromIO((): Set<Namespace> => new Set()),
)

export const getNamespaceChildren = getShared(NamespaceChildren)

export const addChild = (child: Namespace) =>
  doEffect(function* () {
    const children = yield* getNamespaceChildren

    children.add(child)
  })

export const removeChild = (child: Namespace) =>
  doEffect(function* () {
    const children = yield* getNamespaceChildren

    children.delete(child)
  })
