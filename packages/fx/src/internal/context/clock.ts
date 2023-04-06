import { bodyWithTrace } from '@effect/data/Debug'
import type { Clock } from '@effect/io/Clock'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const clock: (_: void) => Fx.WithService<Clock, Clock> = bodyWithTrace(
  (trace) => () => fromEffect(Effect.clock()).traced(trace),
)
