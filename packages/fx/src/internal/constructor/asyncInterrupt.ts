import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'
import type * as FiberId from '@effect/io/Fiber/Id'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const asyncInterrupt: <R, E, A, R2>(
  register: (callback: (_: Effect.Effect<R, E, A>) => void) => Effect.Effect<R2, never, void>,
  blockingOn?: FiberId.None | FiberId.Runtime | FiberId.Composite | undefined,
) => Fx<R | R2, E, A> = methodWithTrace(
  (trace) =>
    <R, E, A, R2>(
      register: (callback: (_: Effect.Effect<R, E, A>) => void) => Effect.Effect<R2, never, void>,
      blockingOn?: FiberId.None | FiberId.Runtime | FiberId.Composite | undefined,
    ) =>
      fromEffect(Effect.asyncInterrupt<R | R2, E, A>(register, blockingOn)).traced(trace),
)
