import * as Effect from '@effect/io/Effect'
import * as Schedule from '@effect/io/Schedule'
import { Duration } from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { scheduled } from './scheduled.js'

const schedule_ = (duration: Duration) =>
  pipe(
    Schedule.forever(),
    Schedule.delayed(() => duration),
  )

export function periodic(duration: Duration): Fx<never, never, void> {
  return pipe(Effect.unit(), scheduled(schedule_(duration)))
}