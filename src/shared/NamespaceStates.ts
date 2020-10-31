import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { pipe } from 'fp-ts/function'

import { strictMap } from './common'
import { getShared } from './getShared'
import { usingGlobal } from './global'
import { shared } from './Shared'
import { SharedEnv } from './SharedEnv'

export const NamespaceStates = shared(
  Symbol('NamespaceStates'),
  Pure.fromIO(() => new Map<any, any>()),
  strictMap,
)

export const getNamespaceStates = pipe(NamespaceStates, getShared, usingGlobal)

export const getNamespaceState = <E, A>(
  key: any,
  initial: Effect<E, A>,
): Effect<E & SharedEnv, A> => {
  const eff = doEffect(function* () {
    const namespaceStates = yield* getNamespaceStates

    if (!namespaceStates.has(key)) {
      namespaceStates.set(key, yield* initial)
    }

    return namespaceStates.get(key)! as A
  })

  return eff
}
