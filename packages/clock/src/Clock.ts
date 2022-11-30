import * as C from '@fp-ts/data/Context'
import { Duration } from '@fp-ts/data/Duration'
import { Time, UnixTime } from '@typed/time'

export interface Clock {
  readonly startTime: UnixTime
  readonly currentTime: () => UnixTime
  readonly fork: () => Clock
}

const getUnixTime = (): UnixTime => UnixTime(Date.now())

const GetUnixTime = {
  currentTime: getUnixTime,
  fork: () => Clock(),
}

export const Clock = Object.assign(function Clock(startTime: UnixTime = getUnixTime()): Clock {
  return {
    startTime,
    ...GetUnixTime,
  }
}, C.Tag<Clock>())

export function startTime(clock: Clock): UnixTime {
  return clock.startTime
}

export function currentTime(clock: Clock): UnixTime {
  return clock.currentTime()
}

export function delay(duration: Duration) {
  return (clock: Clock): UnixTime => UnixTime(clock.currentTime() + duration.millis)
}

export function getTime(clock: Clock): Time {
  return Time(clock.currentTime() - clock.startTime)
}

export function timeDelay(duration: Duration) {
  return (clock: Clock): Time => Time(delay(duration)(clock) - clock.startTime)
}
