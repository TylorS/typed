import { methodWithTrace } from '@effect/data/Debug'
import type { Cause } from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const failCause: <E>(cause: Cause<E>) => Fx<never, E, never> = methodWithTrace(
  (trace) => (cause) => fromEffect(Effect.failCause(cause)).traced(trace),
)
