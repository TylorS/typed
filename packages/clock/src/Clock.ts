import * as C from '@fp-ts/data/Context'
import { Duration } from '@fp-ts/data/Duration'
import { Time, UnixTime } from '@typed/time'

export interface Clock {
  readonly startTime: UnixTime
  readonly time: GetAndDelay<Time>
  readonly unixTime: GetAndDelay<UnixTime>
  readonly fork: () => Clock
}

export interface GetAndDelay<T> {
  readonly get: () => T
  readonly delay: (duration: Duration) => T
}

const now = (): UnixTime => UnixTime(Date.now())

export function Clock(startTime: UnixTime = now()): Clock {
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
    fork: () => Clock(),
  }

  return clock
}

Clock.Tag = C.Tag<Clock>()
