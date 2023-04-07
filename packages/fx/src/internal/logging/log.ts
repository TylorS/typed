import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const log: (message: string) => Fx<never, never, void> = methodWithTrace(
  (trace) => (message: string) => fromEffect(Effect.log(message)).traced(trace),
)