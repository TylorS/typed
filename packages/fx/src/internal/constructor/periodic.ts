import type { Fx } from '@typed/fx/internal/Fx'
import type { Duration } from '@typed/fx/internal/_externals'
import { Effect, Schedule } from '@typed/fx/internal/_externals'
import { schedule } from '@typed/fx/internal/constructor/schedule'

export function periodic(duration: Duration.Duration): Fx<never, never, void> {
  return schedule(
    Effect.unit(),
    Schedule.union(Schedule.repeatForever(), Schedule.fromDelay(duration)),
  )
}
