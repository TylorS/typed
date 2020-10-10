import { lazy } from '@typed/fp/Disposable/exports'
import { fromEnv } from '@typed/fp/Effect/exports'
import { async } from '@typed/fp/Resume/exports'

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
