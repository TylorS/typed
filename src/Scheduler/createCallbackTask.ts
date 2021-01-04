import { Disposable, lazy } from '@fp/Disposable/exports'
import { Task } from '@most/types'
import { IO } from 'fp-ts/IO'

/**
 * Convert an IO<Disposable> into a Most.js Task
 */
export function createCallbackTask(cb: IO<Disposable>, onError?: (error: Error) => void): Task {
  const disposable = lazy()

  return {
    run() {
      if (!disposable.disposed) {
        disposable.addDisposable(cb())
      }
    },
    error(_, e) {
      disposable.dispose()

      if (onError) {
        return onError(e)
      }

      throw e
    },
    dispose: disposable.dispose,
  }
}
