import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const tryPromise: <A>(f: () => Promise<A>) => Fx<never, unknown, A> = methodWithTrace(
  (trace, restore) =>
    <A>(f: () => Promise<A>) =>
      fromEffect(Effect.tryPromise(restore(f))).traced(trace),
)
