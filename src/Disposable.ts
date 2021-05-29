export * from '@most/disposable'

/**
 * Disposable is a synchronous interface, borrowed from most.js, to cancel requests or
 * otherwise clean up resources.
 */

import { disposeAll, disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'

/**
 * A Disposable that works in a more imperative manner.
 * Can be useful when coercing external libraries or using promises.
 */
export interface SettableDisposable extends Disposable {
  readonly addDisposable: (disposable: Disposable) => Disposable
  readonly isDisposed: () => boolean
}

const NONE = disposeNone()

/**
 * Construct a SettableDisposable
 */
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
        disposables.splice(index, 1).forEach((d) => d.dispose())
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

import { ArgsOf } from '@fp/function'
import { FunctionN } from 'fp-ts/function'

/**
 * Wrap a non-Disposable function into a Disposable-returning function
 */
export const undisposable = <F extends FunctionN<readonly any[], any>>(fn: F) => (
  ...args: ArgsOf<F>
): Disposable => {
  fn(...args)

  return disposeNone()
}
