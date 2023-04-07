import { bodyWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import type { Context } from '@typed/fx/internal/externals'
import { Effect } from '@typed/fx/internal/externals'

export const contextWith: <R, A>(f: (context: Context.Context<R>) => A) => Fx.WithService<R, A> =
  bodyWithTrace(
    (trace) =>
      <R, A>(f: (context: Context.Context<R>) => A) =>
        fromEffect(Effect.contextWith(f)).traced(trace),
  )
