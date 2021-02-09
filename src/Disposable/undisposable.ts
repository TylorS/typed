import { ArgsOf } from '@fp/lambda'
import { disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { FunctionN } from 'fp-ts/dist/function'

export const undisposable = <F extends FunctionN<readonly any[], any>>(fn: F) => (
  ...args: ArgsOf<F>
): Disposable => {
  fn(...args)

  return disposeNone()
}
