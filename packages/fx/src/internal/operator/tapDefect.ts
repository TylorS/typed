import { pipe } from '@effect/data/Function'

import type { Fx } from '@typed/fx/internal/Fx'
import { Cause, Chunk, Effect, Option } from '@typed/fx/internal/_externals'
import { tapCause } from '@typed/fx/internal/operator/tapCause'

export function tapDefect<R2, E2, B>(f: (defect: unknown) => Effect.Effect<R2, E2, B>) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A | B> =>
    pipe(
      fx,
      tapCause(
        (cause): Effect.Effect<R2, E | E2, B> =>
          pipe(
            Chunk.get(Cause.defects(cause), 0),
            Option.match(() => Effect.failCause(cause), f),
          ),
      ),
    )
}
