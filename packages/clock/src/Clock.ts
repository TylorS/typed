import * as C from '@fp-ts/data/Context'
import { Duration } from '@fp-ts/data/Duration'
import { Time, UnixTime } from '@typed/time'

export interface Clock {
  readonly startTime: UnixTime
  readonly time: {
    readonly get: () => Time
    readonly delay: (duration: Duration) => Time
  }
  readonly unixTime: {
    readonly get: () => UnixTime
    readonly delay: (duration: Duration) => UnixTime
  }

  readonly fork: () => Clock
}

export const Clock = C.Tag<Clock>()

export const now = (): UnixTime => UnixTime(Date.now())

export function makeDateClock(startTime: UnixTime = now()): Clock {
  const clock: Clock = {
    startTime: UnixTime(startTime),
    time: {
      get: () => Time(now() - startTime),
      delay: (duration) => Time(now() - startTime + duration.millis),
    },
    unixTime: {
      get: now,
      delay: (duration) => UnixTime(now() + duration.millis),
    },
    fork: () => makeDateClock(),
  }

  return clock
}
