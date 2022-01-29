import * as Disposable from '@/Disposable'
import { fromIO, fromPromise } from '@/Effect'

import { Of } from './Fx'

export const dispose = (disposable: Disposable.Disposable): Of<void> =>
  Disposable.checkIsSync(disposable)
    ? fromIO(() => Disposable.dispose(disposable))
    : fromPromise(() => Disposable.dispose(disposable))
