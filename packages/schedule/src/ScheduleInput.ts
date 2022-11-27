import * as Duration from '@fp-ts/data/Duration'
import * as O from '@fp-ts/data/Option'
import { Time } from '@typed/time'

export interface ScheduleInput {
  readonly currentTime: Time
  readonly currentDelay: O.Option<Duration.Duration>
}

export function ScheduleInput(
  currentTime: Time,
  currentDelay: O.Option<Duration.Duration> = O.none,
): ScheduleInput {
  const input: ScheduleInput = {
    currentTime,
    currentDelay,
  }

  return input
}
