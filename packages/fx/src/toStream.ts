import * as Chunk from '@effect/data/Chunk'
import * as Option from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Stream from '@effect/stream/Stream'

import { Fx, Sink } from './Fx.js'

export function toStream<R, E, A>(fx: Fx<R, E, A>): Stream.Stream<R, E, A> {
  return Stream.asyncScoped<R, E, A>((emit) =>
    fx
      .run(
        Sink(
          (a) => Effect.sync(() => emit(Effect.succeed(Chunk.of(a)))),
          (cause) => Effect.sync(() => emit(Effect.failCause(Cause.map(cause, Option.some)))),
        ),
      )
      .pipe(
        Effect.zipRight(Effect.sync(() => emit(Effect.fail(Option.none())))),
        Effect.forkScoped,
      ),
  )
}
