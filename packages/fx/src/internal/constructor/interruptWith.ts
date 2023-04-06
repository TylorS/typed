import { methodWithTrace } from '@effect/data/Debug'
import type { FiberId } from '@effect/io/Fiber/Id'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const interruptWith: (id: FiberId) => Fx<never, never, never> = methodWithTrace(
  (trace) => (id: FiberId) => fromEffect(Effect.interruptWith(id)).traced(trace),
)
