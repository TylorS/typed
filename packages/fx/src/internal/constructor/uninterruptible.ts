import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/externals'

export const uninterruptible: <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, A> = methodWithTrace(
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>): Fx<R, E, A> =>
      self.transform(Effect.uninterruptible).traced(trace),
)
