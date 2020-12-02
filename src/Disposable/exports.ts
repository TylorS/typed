import { disposeAll, disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { number } from 'io-ts/Guard'

export * from '@most/disposable'
export type { Disposable } from '@most/types'

/**
 * A Disposable instance that is capable of imperatively adding additional
 * Disposable resources to it. This can be helpful for converting third-party APIs.
 */
export interface LazyDisposable extends Disposable {
  readonly disposed: boolean
  readonly addDisposable: (d: Disposable) => Disposable
}

/**
 * Create a LazyDisposable instance that can only be dispose of one time.
 * When attempting to add a Disposable after the LazyDisposable has been disposed it will be
 * disposed of synchronously.
 */
export const lazy = <A extends object = {}>(additional: A = {} as A): LazyDisposable & A => {
  let disposed = false
  let disposables: Disposable[] | undefined = []

  const dispose = () => {
    if (disposed) {
      return
    }

    disposed = true
    disposeAll(disposables!).dispose()
    disposables = void 0 // small memory optimization..we may make a lot of these
  }

  const addDisposable = (d: Disposable) => {
    if (d === disposeNone()) {
      return d
    }

    if (disposed) {
      d.dispose()

      return disposeNone()
    }

    disposables!.push(d)

    const dispose = () => {
      const index = disposables!.indexOf(d)

      if (number.is(index) && index > -1) {
        disposables?.splice(index, 1)
      }
    }

    return { dispose }
  }

  return {
    ...additional,
    get disposed() {
      return disposed
    },
    dispose,
    addDisposable,
  }
}

/**
 * Convert a void returning function into a Disposable returning function.
 */
export const undisposable = <A extends ReadonlyArray<any>>(f: (...values: A) => void) => (
  ...values: A
): Disposable => {
  f(...values)

  return disposeNone()
}
