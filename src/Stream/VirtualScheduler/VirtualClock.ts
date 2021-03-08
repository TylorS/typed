import { Clock, Time } from '@most/types'

/**
 * A clock where you control time.
 */
export interface VirtualClock extends Clock {
  readonly progressTimeBy: (elapsedTime: Time) => Time
}

/**
 * Create a virtual clock
 */
export function createVirtualClock(time: Time = 0): VirtualClock {
  return {
    now: () => time,
    progressTimeBy: (elapsedTime) => (time += elapsedTime),
  }
}
