import * as Disposable from '@/Disposable'
import { fromLazy, fromPromise } from '@/Effect'

import { Of } from './Fx'

export const dispose = (disposable: Disposable.Disposable): Of<void> =>
  Disposable.checkIsSync(disposable)
    ? fromLazy(() => Disposable.dispose(disposable))
    : fromPromise(() => Disposable.dispose(disposable))
