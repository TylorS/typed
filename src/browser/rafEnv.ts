import { settable } from '@typed/fp/Disposable'
import { RafEnv } from '@typed/fp/dom'
import { flow } from 'fp-ts/dist/function'

export const rafEnv: RafEnv = {
  requestAnimateFrame: (resume) => {
    const disposable = settable()

    const handle = window.requestAnimationFrame(flow(resume, disposable.addDisposable))

    disposable.addDisposable({ dispose: () => window.cancelAnimationFrame(handle) })

    return disposable
  },
}
