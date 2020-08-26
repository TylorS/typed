import { lazy } from '../Disposable'
import { async, fromEnv } from '../Effect'

export interface RafEnv {
  readonly requestAnimationFrame: typeof requestAnimationFrame
  readonly cancelAnimationFrame: typeof cancelAnimationFrame
}

export const raf = fromEnv((e: RafEnv) =>
  async<number>((resume) => {
    const disposable = lazy()

    const handle = e.requestAnimationFrame((n) => disposable.addDisposable(resume(n)))

    disposable.addDisposable({ dispose: () => e.cancelAnimationFrame(handle) })

    return disposable
  }),
)
