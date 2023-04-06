import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const fail: <E>(error: E) => Fx<never, E, never> = methodWithTrace(
  (trace) => (error) => fromEffect(Effect.fail(error)).traced(trace),
)
