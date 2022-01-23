import { Disposable, dispose } from '@/Disposable'
import { fromPromise, getScope } from '@/Effect'

import { Fx } from './Fx'

export const ensureDisposable = (disposable: Disposable) =>
  Fx(function* () {
    const scope = yield* getScope<never>()

    return scope.ensure(() => fromPromise(async () => dispose(disposable)))
  })
