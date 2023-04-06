import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const promise: <A>(promise: () => Promise<A>) => Fx<never, never, A> = methodWithTrace(
  (trace) => (promise) => fromEffect(Effect.promise(promise)).traced(trace),
)
