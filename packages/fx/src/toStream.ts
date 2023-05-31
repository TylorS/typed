import * as Chunk from '@effect/data/Chunk'
import * as Effect from '@effect/io/Effect'
import * as Stream from '@effect/stream/Stream'

import { Fx } from './Fx.js'
import { observe } from './observe.js'

export function toStream<R, E, A>(fx: Fx<R, E, A>, outputBuffer?: number): Stream.Stream<R, E, A> {
  return Stream.asyncScoped(
    (emit) => observe(fx, (a) => Effect.sync(() => emit(Effect.succeed(Chunk.make(a))))),
    outputBuffer,
  )
}
