import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { pipe } from 'fp-ts/function'

import { strictMap } from './common'
import { getShared } from './getShared'
import { usingGlobal } from './global'
import { shared } from './Shared'
import { getCurrentNamespace, SharedEnv } from './SharedEnv'

export const NamespacePositions = shared(
  Symbol('NamespacePositions'),
  Pure.fromIO(() => new Map<PropertyKey, number>()),
  strictMap,
)

export const getNamespacePositions = pipe(NamespacePositions, getShared, usingGlobal)

export const getNextPosition: Effect<SharedEnv, number> = doEffect(function* () {
  const namespace = yield* getCurrentNamespace

  const positions = yield* getNamespacePositions

  if (!positions.has(namespace)) {
    positions.set(namespace, 0)
  }

  const position = positions.get(namespace)!
  const next = position + 1

  positions.set(namespace, next)

  return next
})

export const resetPosition: Effect<SharedEnv, void> = doEffect(function* () {
  const namespace = yield* getCurrentNamespace
  const positions = yield* getNamespacePositions

  positions.set(namespace, 0)
})
