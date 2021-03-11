import { Env } from '@typed/fp/Env'
import { Resume } from '@typed/fp/Resume'

/**
 * RequestIdleCallback deadline type
 */
export type IdleCallbackDeadline = {
  readonly didTimeout: boolean
  readonly timeRemaining: () => number
}

/**
 * Options for requestIdleCallback
 */
export type IdleCallbackOptions = {
  readonly timeout: number
}

export interface WhenIdleEnv {
  readonly whenIdle: (options?: IdleCallbackOptions) => Resume<IdleCallbackDeadline>
}

export const whenIdle: (options?: IdleCallbackOptions) => Env<WhenIdleEnv, IdleCallbackDeadline> = (
  options,
) => (e) => e.whenIdle(options)
