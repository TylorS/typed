import { methodWithTrace } from '@effect/data/Debug'
import type { Random } from '@effect/io/Random'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import { Effect } from '@typed/fx/internal/externals'

export const randomWith: <R, E, A>(f: (random: Random) => Effect.Effect<R, E, A>) => Fx<R, E, A> =
  methodWithTrace(
    (trace, restore) =>
      <R, E, A>(f: (random: Random) => Effect.Effect<R, E, A>) =>
        fromEffect(Effect.randomWith(restore(f))).traced(trace),
  )
