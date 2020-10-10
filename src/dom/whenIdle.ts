import { Timer } from '@most/types'
import { lazy } from '@typed/fp/Disposable/exports'
import { fromEnv } from '@typed/fp/Effect/exports'
import { async } from '@typed/fp/Resume/exports'
import { iso, Newtype } from 'newtype-ts'

export type IdleCallbackHandle = Newtype<{ readonly IdleCallbackHandle: unique symbol }, any>

const idleCallbackHandle = iso<IdleCallbackHandle>()

export interface WhenIdleEnv {
  readonly requestIdleCallback: (
    callback: (deadline: IdleCallbackDeadline) => void,
    opts?: IdleCallbackOptions,
  ) => IdleCallbackHandle

  readonly cancelIdleCallback: (handle: IdleCallbackHandle) => void
}

export type IdleCallbackDeadline = {
  readonly didTimeout: boolean
  readonly timeRemaining: () => number
}

export type IdleCallbackOptions = {
  readonly timeout: number
}

export const whenIdle = (opts?: IdleCallbackOptions) =>
  fromEnv((e: WhenIdleEnv) =>
    async<IdleCallbackDeadline>((resume) => {
      const disposable = lazy()

      const handle = e.requestIdleCallback((n) => disposable.addDisposable(resume(n)), opts)

      disposable.addDisposable({ dispose: () => e.cancelIdleCallback(handle) })

      return disposable
    }),
  )

const DEFAULT_TIMEOUT = 30 * 1000

export function createFallbackWhenIdleEnv(timer: Timer, defaultTimeout = DEFAULT_TIMEOUT) {
  const allHandles = new Map<IdleCallbackHandle, [any, any]>()
  let currentHandle = 0

  const requestIdleCallback = (
    callback: (deadline: IdleCallbackDeadline) => void,
    opts: IdleCallbackOptions = { timeout: defaultTimeout },
  ): IdleCallbackHandle => {
    let didTimeout = false

    const { timeout } = opts
    const start = timer.now()
    const timeoutTime = start + timeout
    const deadline: IdleCallbackDeadline = {
      get didTimeout() {
        return didTimeout
      },
      timeRemaining: () => Math.max(timeoutTime - timer.now(), 0),
    }

    const handle = idleCallbackHandle.wrap(currentHandle++)
    const initialHandle = timer.setTimer(() => callback(deadline), 0)
    const timeoutHandle = timer.setTimer(() => {
      didTimeout = true
      allHandles.delete(handle)
    }, timeout)

    allHandles.set(handle, [initialHandle, timeoutHandle])

    return handle
  }

  const cancelIdleCallback = (handle: IdleCallbackHandle) => {
    const handles = allHandles.get(handle)

    if (handles) {
      const [a, b] = handles

      timer.clearTimer(a)
      timer.clearTimer(b)
    }
  }

  return {
    requestIdleCallback,
    cancelIdleCallback,
  }
}
