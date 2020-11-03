import { ask, doEffect, execEffect } from '@typed/fp/Effect/exports'
import {
  getCurrentNamespace,
  Namespace,
  SharedEnv,
  usingNamespace,
} from '@typed/fp/Shared/domain/exports'
import { pipe } from 'fp-ts/function'
import { isNone, isSome, some } from 'fp-ts/Option'

import { getNamespaceDisposable } from '../exports'
import { addDisposable } from '../services/exports'
import { addChild, removeChild } from './NamespaceChildren'
import { getNamespaceParent, setNamespaceParent } from './NamespaceParent'

export const addToTree = (parent: Namespace) => {
  const eff = doEffect(function* () {
    const env = yield* ask<SharedEnv>()
    const currentNamespace = yield* getCurrentNamespace
    const currentParent = yield* getNamespaceParent

    // Remove the previous parent if it has changed
    if (isSome(currentParent) && currentParent.value !== parent) {
      yield* pipe(removeChild(currentNamespace), usingNamespace(currentParent.value))
    }

    // Set parent if changed
    if (isNone(currentParent) || currentParent.value !== parent) {
      yield* setNamespaceParent(some(parent))
    }

    // Add as child to parent
    yield* pipe(addChild(currentNamespace), usingNamespace(parent))

    // If disposed remove from parent
    yield* addDisposable({
      dispose: () => pipe(removeChild(currentNamespace), usingNamespace(parent), execEffect(env)),
    })

    // If the parent is disposed, dispose of the child as well
    yield* pipe(yield* getNamespaceDisposable, addDisposable, usingNamespace(parent))
  })

  return eff
}
