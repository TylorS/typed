/**
 * Disposable is an interface for representing resources which can be synchronously
 * disposed of.
 * @since 0.9.2
 */
export * from '@most/disposable'

/**
 * Disposable is a synchronous interface, borrowed from most.js, to cancel requests or
 * otherwise clean up resources.
 */

import { disposeAll, disposeNone } from '@most/disposable'
import * as types from '@most/types'

/**
 * A Disposable that works in a more imperative manner.
 * Can be useful when coercing external libraries or using promises.
 * @since 0.9.2
 * @category Model
 */
export interface SettableDisposable extends types.Disposable {
  readonly addDisposable: (disposable: types.Disposable) => types.Disposable
  readonly isDisposed: () => boolean
}

const NONE = disposeNone()

/**
 * Construct a SettableDisposable
 * @since 0.9.2
 * @category Constructor
 */
export function settable(): SettableDisposable {
  let disposed = false
  const disposables: types.Disposable[] = []

  function addDisposable(disposable: types.Disposable) {
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

import { FunctionN } from 'fp-ts/function'

import { ArgsOf } from './function'

/**
 * Wrap a non-Disposable function into a Disposable-returning function
 * @since 0.9.2
 * @category Combinator
 */
export const undisposable =
  <F extends FunctionN<readonly any[], any>>(fn: F) =>
  (...args: ArgsOf<F>): types.Disposable => {
    fn(...args)

    return disposeNone()
  }

/**
 * Re-export of @most/core's Disposable interface
 * @since 0.11.0
 * @category Model
 */
export type Disposable = types.Disposable
