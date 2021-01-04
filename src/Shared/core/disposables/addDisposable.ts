import { doEffect } from '@fp/Effect/exports'
import { Disposable } from '@most/types'

import { getNamespaceDisposable } from './NamespaceDisposable'

/**
 * Associate a Disposable at a well-known place.
 */
export const addDisposable = (disposable: Disposable) =>
  doEffect(function* () {
    const { addDisposable } = yield* getNamespaceDisposable

    return addDisposable(disposable)
  })
