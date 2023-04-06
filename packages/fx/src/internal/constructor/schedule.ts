import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Effect, pipe, Schedule, Scope } from '@typed/fx/internal/_externals'

export const schedule: {
  <R, E, A, R2, B>(self: Effect.Effect<R, E, A>, schedule: Schedule.Schedule<R2, any, B>): Fx<
    R | R2,
    E,
    A
  >
  <R2, B>(schedule: Schedule.Schedule<R2, any, B>): <R, E, A>(
    self: Effect.Effect<R, E, A>,
  ) => Fx<R | R2, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, B>(self: Effect.Effect<R, E, A>, schedule: Schedule.Schedule<R2, any, B>) =>
      new ScheduleFromFx(self, schedule).traced(trace),
)

export class ScheduleFromFx<R, E, A, R2, B> extends BaseFx<R | R2, E, A> {
  readonly name = 'ScheduleFrom'

  constructor(
    readonly self: Effect.Effect<R, E, A>,
    readonly schedule: Schedule.Schedule<R2, A, B>,
  ) {
    super()
  }

  run(sink: Sink<E, A>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    const effect = Effect.tap(this.self, sink.event)

    return Effect.matchCauseEffect(
      Effect.flatMap(Schedule.driver(this.schedule), (driver) =>
        scheduleFromLoop(effect, this.schedule.initial, driver),
      ),
      sink.error,
      sink.end,
    )
  }
}

const scheduleFromLoop = <R, E, In, R2, Out>(
  self: Effect.Effect<R, E, In>,
  initial: In,
  driver: Schedule.ScheduleDriver<R2, In, Out>,
): Effect.Effect<R | R2, E, Out> =>
  pipe(
    driver.next(initial),
    Effect.matchEffect(
      () => Effect.orDie(driver.last()),
      () =>
        pipe(
          self,
          Effect.flatMap((a) => scheduleFromLoop(self, a, driver)),
        ),
    ),
  )
