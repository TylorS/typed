import type { Scope } from '@effect/io/Scope'

import type { Fx } from './Fx.js'
import { Chunk, Effect } from './externals.js'
import { observe } from './observe.js'

export function toChunk<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R | Scope, E, Chunk.Chunk<A>> {
  return Effect.gen(function* ($) {
    let chunk = Chunk.empty<A>()

    yield* $(observe(fx, (a) => Effect.sync(() => (chunk = Chunk.append(chunk, a)))))

    return chunk
  })
}
