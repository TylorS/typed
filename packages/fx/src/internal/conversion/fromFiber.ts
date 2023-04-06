import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'
import type { Fiber } from '@effect/io/Fiber'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const fromFiber: <Errors, Output>(
  fiber: Fiber<Errors, Output>,
) => Fx<never, Errors, Output> = methodWithTrace(
  (trace) => (fiber) => fromEffect(Effect.fromFiber(fiber)).traced(trace),
)
