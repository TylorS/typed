import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import { Effect } from '@typed/fx/internal/externals'

export const tryCatchPromise: <A, E>(
  f: () => Promise<A>,
  onFail: (error: unknown) => E,
) => Fx<never, E, A> = methodWithTrace(
  (trace, restore) =>
    <A, E>(f: () => Promise<A>, onFail: (error: unknown) => E) =>
      fromEffect(Effect.tryCatchPromise(restore(f), restore(onFail))).traced(trace),
)
