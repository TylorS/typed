import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import type { Cause } from '@typed/fx/internal/externals'
import { Effect } from '@typed/fx/internal/externals'

export const logDebugCause: <E>(cause: Cause.Cause<E>) => Fx<never, never, void> = methodWithTrace(
  (trace) =>
    <E>(cause: Cause.Cause<E>) =>
      fromEffect(Effect.logDebugCause(cause)).traced(trace),
)
