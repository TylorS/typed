import { Disposable } from './Disposable.js'

export function Queue(): Disposable.Queue {
  const disposables: Set<Disposable> = new Set()

  let disposed = false

  return {
    size: () => disposables.size,
    isDisposed: () => disposed,
    offer: (disposable: Disposable) => {
      if (disposed) {
        disposable.dispose()

        return Disposable.unit
      }

      disposables.add(disposable)

      return Disposable(() => disposables.delete(disposable))
    },
    dispose: () => {
      disposed = true
      disposables.forEach((d) => d.dispose())
      disposables.clear()
    },
  }
}
