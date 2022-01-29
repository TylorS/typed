import { Disposable } from '@/Disposable'
import { getScope } from '@/Effect'

import { dispose } from './dispose'
import { Fx } from './Fx'

export const ensureDisposable = (disposable: Disposable) =>
  Fx(function* () {
    const scope = yield* getScope<never>()

    return scope.ensure(() => dispose(disposable))
  })
