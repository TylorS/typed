import { provideSome } from '@typed/fp/Effect/exports'

import { IdleCallbackDeadline, IdleCallbackHandle, IdleCallbackOptions } from './exports'

export const provideWhenIdleEnv = provideSome({
  requestIdleCallback: (
    cb: (deadline: IdleCallbackDeadline) => void,
    opts?: IdleCallbackOptions | undefined,
  ) => window.requestIdleCallback(cb, opts),
  cancelIdleCallback: (handle: IdleCallbackHandle) => window.cancelIdleCallback(handle),
})
