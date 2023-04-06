import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const tryPromiseInterrupt: <A>(
  f: (signal: AbortSignal) => Promise<A>,
) => Fx<never, unknown, A> = methodWithTrace(
  (trace, restore) =>
    <A>(f: (signal: AbortSignal) => Promise<A>) =>
      fromEffect(Effect.tryPromiseInterrupt(restore(f))).traced(trace),
)
