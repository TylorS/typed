import * as Duration from '@fp-ts/data/Duration'
import { constant, pipe } from '@fp-ts/data/Function'
import * as O from '@fp-ts/data/Option'
import { Time } from '@typed/time'

import { ScheduleContinue, ScheduleDecision, ScheduleDone } from './ScheduleDecision.js'
import { ScheduleInput } from './ScheduleInput.js'
import { ScheduleState } from './ScheduleState.js'

export interface Schedule {
  readonly step: (state: ScheduleState, time: Time) => readonly [ScheduleState, ScheduleDecision]

  readonly and: (that: Schedule) => Schedule
  readonly or: (that: Schedule) => Schedule
}

export function Schedule(step: Schedule['step']): Schedule {
  const schedule: Schedule = {
    step,
    and: (that) =>
      Schedule((state, input) => {
        const f = step(state, input)
        const s = that.step(state, input)

        return [f[0].and(s[0]), f[1].and(s[1])]
      }),
    or: (that) =>
      Schedule((state, input) => {
        const f = step(state, input)
        const s = that.step(state, input)

        return [f[0].or(s[0]), f[1].or(s[1])]
      }),
  }

  return schedule
}

Schedule.decision = (
  f: (current: ScheduleState, next: ScheduleState) => ScheduleDecision,
): Schedule =>
  Schedule((current, currentTime) => {
    const next = ScheduleState.step(current, ScheduleInput(currentTime))
    return [next, f(current, next)]
  })

export const never = Schedule.decision(constant(ScheduleDone))

export const forever = Schedule.decision(constant(ScheduleContinue(O.none)))

export const maxIterations = (n: number): Schedule =>
  Schedule.decision((state) => (state.iterations < n ? ScheduleContinue(O.none) : ScheduleDone))

export const once = maxIterations(1)

export const periodic = (delay: Duration.Duration) =>
  Schedule((state, currentTime) => {
    const currentDelay = pipe(
      state.previousTime,
      O.match(
        () => delay,
        (previousTime) => accountForTimeDrift(previousTime, currentTime, delay),
      ),
      O.some,
    )

    return [
      ScheduleState.step(state, ScheduleInput(currentTime, currentDelay)),
      ScheduleContinue(currentDelay),
    ]
  })

// Enable periodic tasks to run with much greater precision than running a task
// one after another. This is done by accounting for the time drift between
// each task.
const accountForTimeDrift = (
  previous: Time,
  now: Time,
  delay: Duration.Duration,
): Duration.Duration => {
  const expectedTime = previous + delay.millis
  const drift = expectedTime > now ? expectedTime - now : 0

  return Duration.millis(drift)
}

export const spaced = (delay: Duration.Duration) =>
  Schedule((state, currentTime) => {
    const currentDelay = pipe(
      state.previousDelay,
      O.match(
        () => delay,
        (previous) => Duration.millis(previous.millis + delay.millis),
      ),
      O.some,
    )

    return [
      ScheduleState.step(state, ScheduleInput(currentTime, currentDelay)),
      ScheduleContinue(currentDelay),
    ]
  })

export const exponential = (delay: Duration.Duration) =>
  Schedule((state, currentTime) => {
    const currentDelay = O.some(Duration.millis(delay.millis ** (state.iterations + 1)))

    return [
      ScheduleState.step(state, ScheduleInput(currentTime, currentDelay)),
      ScheduleContinue(currentDelay),
    ]
  })
