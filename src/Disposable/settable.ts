import { disposeAll, disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'

// A Disposable that works in a more imperative manner.
// Can be useful when coercing external libraries or using promises.
export interface SettableDisposable extends Disposable {
  readonly addDisposable: (disposable: Disposable) => Disposable
  readonly isDisposed: () => boolean
}

const NONE = disposeNone()

export function settable(): SettableDisposable {
  let disposed = false
  const disposables: Disposable[] = []

  function addDisposable(disposable: Disposable) {
    if (NONE === disposable || disposed) {
      disposable.dispose()

      return NONE
    }

    disposables.push(disposable)

    const dispose = () => {
      const index = disposables.indexOf(disposable)

      if (index > -1) {
        disposables.splice(index, 1)
      }
    }

    return { dispose }
  }

  function isDisposed() {
    return disposed
  }

  function dispose() {
    disposed = true

    disposeAll(disposables).dispose()
  }

  return {
    addDisposable,
    isDisposed,
    dispose,
  }
}
