import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'
import type * as FiberId from '@effect/io/Fiber/Id'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const async: <R, E, A>(
  register: (callback: (_: Effect.Effect<R, E, A>) => void) => void,
  blockingOn?: FiberId.None | FiberId.Runtime | FiberId.Composite | undefined,
) => Fx<R, E, A> = methodWithTrace(
  (trace) => (register, blockingOn) => fromEffect(Effect.async(register, blockingOn)).traced(trace),
)
