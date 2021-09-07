import { constant, constVoid, FunctionN } from 'fp-ts/function'

import { ArgsOf } from '@/internal'

export interface Disposable {
  readonly dispose: Dispose
}

export type Dispose = () => void | Promise<void>

export namespace Disposable {
  export const None: Disposable = {
    dispose: constVoid,
  }
}

export const disposeNone = constant(Disposable.None)

export const undisposable = <F extends FunctionN<readonly any[], any>>(f: F) => {
  return (...args: ArgsOf<F>): Disposable => {
    f(...args)

    return Disposable.None
  }
}
