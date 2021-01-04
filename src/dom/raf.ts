import { lazy } from '@fp/Disposable/exports'
import { Effect, fromEnv } from '@fp/Effect/exports'
import { async } from '@fp/Resume/exports'

/**
 * An environment type for scheduling and cancelling with requestAnimationFrame.
 */
export interface RafEnv<Handle = any> {
  readonly requestAnimationFrame: (callback: FrameRequestCallback) => Handle
  readonly cancelAnimationFrame: (handle: Handle) => void
}

/**
 * An effect for waiting until the next animation frame.
 */
export const raf: Effect<RafEnv, number> = fromEnv((e: RafEnv) =>
  async<number>((resume) => {
    const disposable = lazy()

    const handle = e.requestAnimationFrame((n) => disposable.addDisposable(resume(n)))

    disposable.addDisposable({
      dispose: () => e.cancelAnimationFrame(handle),
    })

    return disposable
  }),
)
