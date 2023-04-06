import { methodWithTrace } from '@effect/data/Debug'
import type { LazyArg } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const failSync: <E>(error: LazyArg<E>) => Fx<never, E, never> = methodWithTrace(
  (trace) => (error) => fromEffect(Effect.failSync(error)).traced(trace),
)
