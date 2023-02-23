import type { Duration } from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Schedule from '@effect/io/Schedule'

import type { Fx } from '../Fx.js'

import { scheduled } from './scheduled.js'

const schedule_ = (duration: Duration) =>
  pipe(
    Schedule.forever(),
    Schedule.delayed(() => duration),
  )

export function periodic(duration: Duration): Fx<never, never, void> {
  return pipe(Effect.unit(), scheduled(schedule_(duration)))
}
