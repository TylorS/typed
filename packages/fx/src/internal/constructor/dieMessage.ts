import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const dieMessage: (message: string) => Fx<never, never, never> = methodWithTrace(
  (trace) => (error) => fromEffect(Effect.dieMessage(error)).traced(trace),
)
