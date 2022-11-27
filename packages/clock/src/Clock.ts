import * as C from '@fp-ts/data/Context'
import { Duration } from '@fp-ts/data/Duration'
import { Time, UnixTime } from '@typed/time'

export interface Clock {
  readonly startTime: UnixTime
  readonly get: () => UnixTime
  readonly delay: (duration: Duration) => UnixTime
  readonly fork: () => Clock
}

const getUnixTime = (): UnixTime => UnixTime(Date.now())

const GetUnixTime = {
  get: getUnixTime,
  delay: (duration: Duration) => UnixTime(getUnixTime() + duration.millis),
  fork: () => Clock(),
}

export function Clock(startTime: UnixTime = getUnixTime()): Clock {
  return {
    ...GetUnixTime,
    startTime,
  }
}

export const Tag = C.Tag<Clock>()

export function startTime(clock: Clock): UnixTime {
  return clock.startTime
}

export function get(clock: Clock): UnixTime {
  return clock.get()
}

export function delay(duration: Duration) {
  return (clock: Clock): UnixTime => clock.delay(duration)
}

export function getTime(clock: Clock): Time {
  return Time(clock.get() - clock.startTime)
}

export function timeDelay(duration: Duration) {
  return (clock: Clock): Time => Time(clock.delay(duration) - clock.startTime)
}
