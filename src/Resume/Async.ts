import { Arity1 } from '@typed/fp/common/exports'
import { Disposable, disposeNone, lazy } from '@typed/fp/Disposable/exports'

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
    run: resumeOnce(run),
  }
}

function resumeOnce<A>(run: (resume: Arity1<A, Disposable>) => Disposable) {
  return (resume: Arity1<A, Disposable>) => {
    let hasResumed = false

    const disposable = lazy()

    disposable.addDisposable(
      run((a) => {
        if (hasResumed) {
          return disposeNone()
        }

        hasResumed = true

        disposable.dispose()

        return resume(a)
      }),
    )

    return disposable
  }
}
