import { methodWithTrace } from '@effect/data/Debug'
import type * as Effect from '@effect/io/Effect'

import type { Fx } from '@typed/fx/internal/Fx'
import { Chunk } from '@typed/fx/internal/externals'
import { reduce } from '@typed/fx/internal/run/reduce'

export const toChunk: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>> =
  methodWithTrace(
    (trace) =>
      <R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, Chunk.Chunk<A>> =>
        reduce(fx, Chunk.empty<A>(), Chunk.append<A, A>).traced(trace),
  )
