import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const interrupt: (_: void) => Fx<never, never, never> = methodWithTrace(
  (trace) => () => fromEffect(Effect.interrupt()).traced(trace),
)
