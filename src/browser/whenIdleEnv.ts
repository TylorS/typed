import { settable } from '@typed/fp/Disposable'
import { IdleCallbackDeadline, IdleCallbackOptions, WhenIdleEnv } from '@typed/fp/dom'
import { async } from '@typed/fp/Resume'
import { flow } from 'fp-ts/dist/function'

declare global {
  // Extend global window with requestIdleCallback since it is not currently provided by TS.
  export interface Window {
    readonly requestIdleCallback: (
      callback: (deadline: IdleCallbackDeadline) => void,
      opts?: IdleCallbackOptions,
    ) => number

    readonly cancelIdleCallback: (handle: number) => void
  }
}

export const whenIdleEnv: WhenIdleEnv = {
  whenIdle: (options) =>
    async((resume) => {
      const disposable = settable()
      const handle = window.requestIdleCallback(flow(resume, disposable.addDisposable), options)

      disposable.addDisposable({ dispose: () => window.cancelIdleCallback(handle) })

      return disposable
    }),
}
