import { none, Option, some } from 'fp-ts/Option'

import { Disposable } from './Disposable'

export interface SettableDisposable<A> extends Disposable<readonly A[]> {
  readonly add: (disposable: Disposable<A>) => Disposable<void>
  readonly isDisposed: () => boolean
}

export function settable<A>(): SettableDisposable<A> {
  let isDisposed = false
  let isDisposing = false

  const check = (): boolean => isDisposed || isDisposing

  const disposables: Set<Disposable<A>> = new Set()

  async function dispose(): Promise<readonly A[]> {
    if (isDisposed) {
      return []
    }

    isDisposing = true
    const values = await Promise.all(Array.from(disposables).map((d) => d.dispose()))
    disposables.clear()
    isDisposing = false

    isDisposed = true

    return values
  }

  function add(d: Disposable<A>): Disposable<void> {
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

export function addIfNotDisposed<A>(disposable: Disposable<A>) {
  return (settable: SettableDisposable<A>): Option<Disposable<void>> =>
    settable.isDisposed() ? none : some(settable.add(disposable))
}
