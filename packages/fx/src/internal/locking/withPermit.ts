import { dualWithTrace } from '@effect/data/Debug'
import type { Semaphore } from '@effect/io/Effect'

import type { Fx } from '@typed/fx/internal/Fx'
import { WithPermitsFx } from '@typed/fx/internal/locking/withPermits'

export const withPermit: {
  <R, E, A>(fx: Fx<R, E, A>, semaphore: Semaphore): Fx<R, E, A>
  (semaphore: Semaphore): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>, semaphore: Semaphore): Fx<R, E, A> =>
      new WithPermitsFx(fx, semaphore, 1).traced(trace),
)
