import * as C from '@fp-ts/data/Context'
import { Duration } from '@fp-ts/data/Duration'
import { Time, UnixTime } from '@typed/time'

export interface Clock {
  readonly startTime: UnixTime
  readonly getUnixTime: () => UnixTime
  readonly fork: () => Clock
}

const now = (): UnixTime => UnixTime(Date.now())

const GetUnixTime = {
  getUnixTime: now,
  fork: () => Clock(),
}

export const Clock = Object.assign(function makeClock(startTime: UnixTime = now()): Clock {
  return {
    startTime,
    ...GetUnixTime,
  }
}, C.Tag<Clock>())

export function startTime(clock: Clock): UnixTime {
  return clock.startTime
}

export function getUnixTime(clock: Clock): UnixTime {
  return clock.getUnixTime()
}

export function delay(duration: Duration) {
  return (clock: Clock): UnixTime => UnixTime(clock.getUnixTime() + duration.millis)
}

export function getTime(clock: Clock): Time {
  return Time(clock.getUnixTime() - clock.startTime)
}

export function timeDelay(duration: Duration) {
  return (clock: Clock): Time => Time(delay(duration)(clock) - clock.startTime)
}
