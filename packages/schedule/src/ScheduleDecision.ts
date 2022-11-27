import * as Duration from '@fp-ts/data/Duration'
import * as O from '@fp-ts/data/Option'

import { maxDurationOptionMonoid, minDurationOptionMonoid } from './internal.js'

export type ScheduleDecision = ScheduleContinue | ScheduleDone

export interface ScheduleContinue {
  readonly _tag: 'Continue'
  readonly delay: O.Option<Duration.Duration>
  readonly and: (other: ScheduleDecision) => ScheduleDecision
  readonly or: (other: ScheduleDecision) => ScheduleDecision
}

export function ScheduleContinue(delay: O.Option<Duration.Duration>): ScheduleContinue {
  const cont: ScheduleContinue = {
    _tag: 'Continue',
    delay,
    and: (other) =>
      other._tag === 'Continue'
        ? ScheduleContinue(maxDurationOptionMonoid.combine(other.delay)(delay))
        : cont,
    or: (other) =>
      other._tag === 'Continue'
        ? ScheduleContinue(minDurationOptionMonoid.combine(other.delay)(delay))
        : cont,
  }

  return cont
}

export interface ScheduleDone {
  readonly _tag: 'Done'
  readonly and: (other: ScheduleDecision) => ScheduleDecision
  readonly or: (other: ScheduleDecision) => ScheduleDecision
}

export const ScheduleDone: ScheduleDone = {
  _tag: 'Done',
  and: () => ScheduleDone,
  or: (other) => (other._tag === 'Done' ? ScheduleDone : other),
}
