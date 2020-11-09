import { Clock, Time } from '@most/types'

export interface VirtualClock extends Clock {
  readonly progressTimeBy: (elapsedTime: Time) => Time
}

export function createVirtualClock(time: Time = 0): VirtualClock {
  return {
    now: () => time,
    progressTimeBy: (elapsedTime) => (time += elapsedTime),
  }
}
