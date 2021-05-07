import { Resume } from '@fp/Resume'

export interface WhenIdle {
  readonly whenIdle: (options?: WhenIdleOptions) => Resume<WhenIdleDeadline>
}

export const whenIdle = (options?: WhenIdleOptions) => (e: WhenIdle) => e.whenIdle(options)

export type WhenIdleOptions = {
  readonly timeout: number
}

export type WhenIdleDeadline = {
  readonly didTimeout: boolean
  readonly timeRemaining: () => number
}
