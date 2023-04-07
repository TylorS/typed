import { bodyWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import type { Context } from '@typed/fx/internal/externals'
import { Effect } from '@typed/fx/internal/externals'

export const contextWithEffect: <R, R2, E2, A>(
  f: (context: Context.Context<R>) => Effect.Effect<R2, E2, A>,
) => Fx<R | R2, E2, A> = bodyWithTrace(
  (trace) => (f) => fromEffect(Effect.contextWithEffect(f)).traced(trace),
)
