import { Arity1 } from '@typed/fp/common/exports'
import { Disposable } from '@typed/fp/Disposable/exports'

/**
 * An cancelable asynchronous effect
 */
export interface Async<A> {
  readonly async: true
  readonly run: (resume: Arity1<A, Disposable>) => Disposable
}

/**
 * Resume an effect asynchronously, can only be resumed one time.
 */
export const async = <A>(run: (resume: Arity1<A, Disposable>) => Disposable): Async<A> => {
  return {
    async: true,
    run,
  }
}
