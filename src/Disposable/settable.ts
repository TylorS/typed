import { Disposable } from './Disposable'

export interface Settable extends Disposable {
  readonly add: (d: Disposable) => Disposable
  readonly isDisposed: () => boolean
}

export function settable(): Settable {
  const disposables: Set<Disposable> = new Set()
  let disposed = false

  const isDisposed = (): boolean => disposed
  const add = (d: Disposable): Disposable => {
    if (disposed) {
      return d
    }

    disposables.add(d)

    return {
      dispose: () => {
        disposables.delete(d)
      },
    }
  }

  const dispose = async (): Promise<void> => {
    disposed = true
    await Promise.all(Array.from(disposables).map((d) => d.dispose()))
    disposables.clear()
  }

  return {
    isDisposed,
    add,
    dispose,
  }
}
