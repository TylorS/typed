import { constant, constVoid, FunctionN } from 'fp-ts/function'

import { ArgsOf } from '@/internal'

export interface Disposable<A> {
  readonly dispose: Dispose<A>
}

export type Dispose<A> = () => A | Promise<A>

export namespace Disposable {
  export const None: Disposable<any> = {
    dispose: constVoid,
  }
}

export const disposeNone = constant(Disposable.None)

export const undisposable = <F extends FunctionN<readonly any[], any>>(f: F) => {
  return (...args: ArgsOf<F>): Disposable<any> => {
    f(...args)

    return Disposable.None
  }
}
