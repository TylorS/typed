import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const promiseInterrupt: <A>(
  promise: (signal: AbortSignal) => Promise<A>,
) => Fx<never, unknown, A> = methodWithTrace(
  (trace) => (promise) => fromEffect(Effect.promiseInterrupt(promise)).traced(trace),
)
