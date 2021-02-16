import { disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { ArgsOf } from '@typed/fp/lambda'
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
