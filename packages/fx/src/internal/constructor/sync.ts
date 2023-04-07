import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import { Effect } from '@typed/fx/internal/externals'

export const sync: <A>(f: () => A) => Fx<never, never, A> = methodWithTrace(
  (trace, restore) =>
    <A>(f: () => A) =>
      fromEffect(Effect.sync(restore(f))).traced(trace),
)
