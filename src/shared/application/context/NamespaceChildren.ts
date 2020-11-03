import { doEffect, Pure } from '@typed/fp/Effect/exports'
import { getShared, Namespace, shared } from '@typed/fp/Shared/domain/exports'

export const NamespaceChildren = shared(
  Symbol('NamespaceChildren'),
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
