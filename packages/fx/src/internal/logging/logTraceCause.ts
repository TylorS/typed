import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import type { Cause } from '@typed/fx/internal/_externals'
import { Effect } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const logTraceCause: <E>(cause: Cause.Cause<E>) => Fx<never, never, void> = methodWithTrace(
  (trace) =>
    <E>(cause: Cause.Cause<E>) =>
      fromEffect(Effect.logTraceCause(cause)).traced(trace),
)
