import { none, Option, some } from 'fp-ts/Option'

import { Disposable } from './Disposable'

export interface SettableDisposable extends Disposable {
  readonly add: (disposable: Disposable) => Disposable
  readonly isDisposed: () => boolean
}

export function settable(): SettableDisposable {
  let isDisposed = false
  let isDisposing = false

  const check = (): boolean => isDisposed || isDisposing

  const disposables: Set<Disposable> = new Set()

  async function dispose(): Promise<void> {
    if (isDisposed) {
      return
    }

    isDisposing = true
    await Promise.all(Array.from(disposables).map((d) => d.dispose()))
    disposables.clear()
    isDisposing = false

    isDisposed = true
  }

  function add(d: Disposable): Disposable {
    if (check()) {
      throw new Error(`Unable to add a Disposable after disposed.`)
    }

    disposables.add(d)

    return {
      dispose: () => {
        disposables.delete(d)
      },
    }
  }

  return {
    isDisposed: check,
    dispose,
    add,
  }
}

export function addIfNotDisposed(disposable: Disposable) {
  return (settable: SettableDisposable): Option<Disposable> =>
    settable.isDisposed() ? none : some(settable.add(disposable))
}
