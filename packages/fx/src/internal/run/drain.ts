import * as Effect from '@effect/io/Effect'

import type { Fx } from '@typed/fx/internal/Fx'
import { observe } from '@typed/fx/internal/run/observe'

export const drain: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, void> = observe(
  Effect.unit,
) as <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, void>
