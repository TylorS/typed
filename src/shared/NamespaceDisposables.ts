import { Disposable } from '@most/types'
import { lazy, LazyDisposable } from '@typed/fp/Disposable/exports'
import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { pipe } from 'fp-ts//function'

import { strictMap } from './common'
import { getShared } from './getShared'
import { usingGlobal } from './global'
import { shared } from './Shared'
import { getCurrentNamespace, SharedEnv } from './SharedEnv'

export const NamespaceDisposables = shared(
  'NamespaceDisposables',
  Pure.fromIO(() => new Map<PropertyKey, LazyDisposable>()),
  strictMap,
)

export const getNamespaceDisposables = pipe(NamespaceDisposables, getShared, usingGlobal)

export const addDisposable = (disposable: Disposable): Effect<SharedEnv, Disposable> =>
  usingGlobal(
    doEffect(function* () {
      const namespace = yield* getCurrentNamespace
      const namespaceDisposables = yield* getNamespaceDisposables

      if (namespaceDisposables.has(namespace)) {
        return namespaceDisposables.get(namespace)!.addDisposable(disposable)
      }

      const namespaceDisposable = lazy()

      namespaceDisposables.set(namespace, namespaceDisposable)

      return namespaceDisposable.addDisposable(disposable)
    }),
  )
