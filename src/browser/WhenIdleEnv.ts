import {
  IdleCallbackDeadline,
  IdleCallbackHandle,
  IdleCallbackOptions,
  WhenIdleEnv,
} from '@fp/dom/exports'
import { Provider, provideSome } from '@fp/Effect/exports'

/**
 * Browser implementation of WhenIdleEnv that uses requestIdleCallback to schedule work to be done when
 * no other higher-priority work needed to be done.
 */
export const whenIdleEnv: WhenIdleEnv = {
  requestIdleCallback: (
    cb: (deadline: IdleCallbackDeadline) => void,
    opts?: IdleCallbackOptions | undefined,
  ) => window.requestIdleCallback(cb, opts),
  cancelIdleCallback: (handle: IdleCallbackHandle) => window.cancelIdleCallback(handle),
}

/**
 * Provide an Effect with a requestIdleCallback version of WhenIdleEnv.
 */
export const provideWhenIdleEnv: Provider<WhenIdleEnv> = provideSome(whenIdleEnv)
