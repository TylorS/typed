import { Duration } from '@fp-ts/data/Duration'
import { Clock } from '@typed/clock'
import { MIN_UNIX_TIME, Time, UnixTime } from '@typed/time'

export interface TestClock extends Clock {
  readonly progressTimeBy: (duration: Duration) => Time
  readonly fork: () => TestClock
}

export function makeTestClock(startTime: UnixTime = MIN_UNIX_TIME): TestClock {
  let currentTime = 0

  const clock: TestClock = {
    startTime,
    time: {
      get: () => Time(currentTime),
      delay: (duration) => Time(currentTime + duration.millis),
    },
    unixTime: {
      get: () => UnixTime(startTime + currentTime),
      delay: (duration) => UnixTime(startTime + currentTime + duration.millis),
    },
    progressTimeBy: (duration) => {
      currentTime += duration.millis

      return Time(currentTime)
    },
    fork: () => makeTestClock(clock.unixTime.get()),
  }

  return clock
}
