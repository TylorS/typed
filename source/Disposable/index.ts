import { disposeAll, disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'

export * from '@most/disposable'
export { Disposable } from '@most/types'

export interface LazyDisposable extends Disposable {
  readonly disposed: boolean
  readonly addDisposable: (d: Disposable) => Disposable
}

export const lazy = (): LazyDisposable => {
  let disposed = false
  let disposables: Disposable[] = []

  const dispose = () => {
    if (disposed) {
      return
    }

    disposed = true

    disposeAll(disposables).dispose()
    disposables = void 0 as any // memory optimization
  }

  const addDisposable = (d: Disposable) => {
    if (disposed) {
      d.dispose()

      return disposeNone()
    }

    disposables.push(d)

    const dispose = () => {
      const index = disposables.indexOf(d)

      disposables.splice(index, 1)
    }

    return { dispose }
  }

  return {
    get disposed() {
      return disposed
    },
    dispose,
    addDisposable,
  }
}
