import * as Duration from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'
import * as O from '@fp-ts/data/Option'
import { Time } from '@typed/time'

import { ScheduleInput } from './ScheduleInput.js'
import {
  maxTimeSemigroup,
  minTimeOptionMonoid,
  minDurationOptionMonoid,
  maxTimeOptionMonoid,
  maxDurationOptionMonoid,
} from './internal.js'

export interface ScheduleState {
  readonly startTime: Time
  readonly iterations: number
  readonly previousTime: O.Option<Time>
  readonly previousDelay: O.Option<Duration.Duration>

  readonly or: (that: ScheduleState) => ScheduleState
  readonly and: (that: ScheduleState) => ScheduleState
}

export namespace ScheduleState {
  export const initial = (startTime: Time): ScheduleState => {
    const state: ScheduleState = {
      startTime,
      iterations: 0,
      previousTime: O.none,
      previousDelay: O.none,
      or: (that) => new Or(state, that),
      and: (that) => new And(state, that),
    }

    return state
  }

  export const step = (state: ScheduleState, input: ScheduleInput): ScheduleState => {
    const next: ScheduleState = {
      startTime: state.startTime,
      iterations: state.iterations + 1,
      previousTime: O.some(input.currentTime),
      previousDelay: input.currentDelay,
      or: (that) => new Or(next, that),
      and: (that) => new And(next, that),
    }

    return state
  }
}

class Or implements ScheduleState {
  constructor(readonly left: ScheduleState, readonly right: ScheduleState) {}

  readonly startTime: Time = Time(
    maxTimeSemigroup.combine(this.right.startTime)(this.left.startTime),
  )
  readonly iterations: number = Math.max(this.left.iterations, this.right.iterations)
  readonly previousTime: O.Option<Time> = pipe(
    this.left.previousTime,
    minTimeOptionMonoid.combine(this.right.previousTime),
    O.map(Time),
  )
  readonly previousDelay: O.Option<Duration.Duration> = pipe(
    this.left.previousDelay,
    minDurationOptionMonoid.combine(this.right.previousDelay),
  )

  readonly or = (that: ScheduleState): ScheduleState => new Or(this, that)
  readonly and = (that: ScheduleState): ScheduleState => new And(this, that)
}

class And implements ScheduleState {
  constructor(readonly left: ScheduleState, readonly right: ScheduleState) {}

  readonly startTime: Time = Time(
    maxTimeSemigroup.combine(this.right.startTime)(this.left.startTime),
  )
  readonly iterations: number = Math.max(this.left.iterations, this.right.iterations)
  readonly previousTime: O.Option<Time> = pipe(
    this.left.previousTime,
    maxTimeOptionMonoid.combine(this.right.previousTime),
    O.map(Time),
  )
  readonly previousDelay: O.Option<Duration.Duration> = pipe(
    this.left.previousDelay,
    maxDurationOptionMonoid.combine(this.right.previousDelay),
  )

  readonly or = (that: ScheduleState): ScheduleState => new Or(this, that)
  readonly and = (that: ScheduleState): ScheduleState => new And(this, that)
}
