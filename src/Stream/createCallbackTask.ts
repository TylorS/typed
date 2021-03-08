import { Disposable, Task } from '@most/types'
import { settable } from '@typed/fp/Disposable'
import { IO } from 'fp-ts/dist/IO'

/**
 * Convert an IO<Disposable> into a Most.js Task
 */
export function createCallbackTask(cb: IO<Disposable>, onError?: (error: Error) => void): Task {
  const disposable = settable()

  return {
    run() {
      if (!disposable.isDisposed()) {
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
