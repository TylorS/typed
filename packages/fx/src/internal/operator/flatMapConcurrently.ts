import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { suspend } from '@typed/fx/internal/constructor/suspend'
import { Effect } from '@typed/fx/internal/externals'
import { withPermit } from '@typed/fx/internal/locking/withPermit'
import { flatMap } from '@typed/fx/internal/operator/flatMap'

export const flatMapConcurrently: {
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, concurrency: number, f: (value: A) => Fx<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    B
  >
  <A, R2, E2, B>(concurrency: number, f: (value: A) => Fx<R2, E2, B>): <R, E>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, B>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, A, R2, E2, B>(
      self: Fx<R, E, A>,
      concurrency: number,
      f: (value: A) => Fx<R2, E2, B>,
    ): Fx<R | R2, E | E2, B> =>
      suspend(() => {
        const semaphore = Effect.unsafeMakeSemaphore(concurrency)

        return flatMap(self, (a) => withPermit(f(a), semaphore))
      }).traced(trace),
)

export const concatMap: {
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, f: (value: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
  <A, R2, E2, B>(f: (value: A) => Fx<R2, E2, B>): <R, E>(self: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      self: Fx<R, E, A>,
      f: (value: A) => Fx<R2, E2, B>,
    ): Fx<R | R2, E | E2, B> =>
      flatMapConcurrently(self, 1, f).traced(trace),
)
