import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import { Effect } from '@typed/fx/internal/externals'

export const interrupt: (_: void) => Fx<never, never, never> = methodWithTrace(
  (trace) => () => fromEffect(Effect.interrupt()).traced(trace),
)
