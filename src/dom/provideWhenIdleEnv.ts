import { Provider, provideSome } from '@typed/fp/Effect/exports'

import {
  IdleCallbackDeadline,
  IdleCallbackHandle,
  IdleCallbackOptions,
  WhenIdleEnv,
} from './whenIdle'

export const provideWhenIdleEnv: Provider<WhenIdleEnv> = provideSome({
  requestIdleCallback: (
    cb: (deadline: IdleCallbackDeadline) => void,
    opts?: IdleCallbackOptions | undefined,
  ) => window.requestIdleCallback(cb, opts),
  cancelIdleCallback: (handle: IdleCallbackHandle) => window.cancelIdleCallback(handle),
})
