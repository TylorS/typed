import { disposeAll } from '@most/disposable'
import { ask, doEffect, Effect, execEffect } from '@typed/fp/Effect/exports'
import {
  getCurrentNamespace,
  Namespace,
  SharedEnv,
  usingNamespace,
} from '@typed/fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'
import { isNone, isSome, some } from 'fp-ts/Option'

import { addDisposable, getNamespaceDisposable } from '../core/disposables/exports'
import { addChild, removeChild } from './NamespaceChildren'
import { getNamespaceParent, setNamespaceParent } from './NamespaceParent'

export const addToTree = (parent: Namespace): Effect<SharedEnv, void> => {
  const eff = doEffect(function* () {
    const env = yield* ask<SharedEnv>()
    const currentNamespace = yield* getCurrentNamespace
    const currentParent = yield* getNamespaceParent

    // Remove the previous parent if it has changed
    if (isSome(currentParent) && currentParent.value !== parent) {
      yield* pipe(currentNamespace, removeChild, usingNamespace(currentParent.value))
    }

    // Set parent if changed
    if (isNone(currentParent) || currentParent.value !== parent) {
      yield* setNamespaceParent(some(parent))
      // Add as child to parent
      yield* pipe(currentNamespace, addChild, usingNamespace(parent))
    }

    yield* addDisposable(
      disposeAll([
        // If the parent is disposed, dispose of the child as well
        yield* pipe(yield* getNamespaceDisposable, addDisposable, usingNamespace(parent)),
        // If disposed, remove from parent
        {
          dispose: () =>
            pipe(currentNamespace, removeChild, usingNamespace(parent), execEffect(env)),
        },
      ]),
    )
  })

  return eff
}
