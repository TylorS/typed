import { dualWithTrace } from '@effect/data/Debug'
import type { Duration } from '@effect/data/Duration'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const at: {
  <A>(value: A, delay: Duration): Fx<never, never, A>
  (delay: Duration): <A>(value: A) => Fx<never, never, A>
} = dualWithTrace(2, (trace) => <A>(value: A, delay: Duration): Fx<never, never, A> => {
  return fromEffect(Effect.as(Effect.sleep(delay), value)).traced(trace)
})
