import * as Chunk from "@effect/data/Chunk"
import * as Option from "@effect/data/Option"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import type * as Scope from "@effect/io/Scope"
import * as Stream from "@effect/stream/Stream"
import * as Fx from "@typed/fx/Fx"
import { Sink } from "@typed/fx/Sink"

/**
 * Convert an Fx to a Stream
 * @since 1.18.0
 * @category conversions
 */
export function toStream<R, E, A>(fx: Fx.Fx<R, E, A>): Stream.Stream<R, E, A> {
  return Stream.asyncScoped<R | Scope.Scope, E, A>((emit) =>
    Fx.run(
      fx,
      Sink(
        (cause) => Effect.promise(() => emit(Effect.failCause(Cause.map(cause, Option.some)))),
        (a) => Effect.promise(() => emit(Effect.succeed(Chunk.of(a))))
      )
    )
      .pipe(
        Effect.zipRight(Effect.promise(() => emit(Effect.fail(Option.none())))),
        Effect.forkScoped
      )
  )
}

/**
 * Convert a Stream to an Fx of chunks
 * @since 1.18.0
 * @category conversions
 */
export function chunked<R, E, A>(stream: Stream.Stream<R, E, A>): Fx.Fx<R, E, Chunk.Chunk<A>> {
  return Fx.fromSink((sink) => Effect.catchAllCause(Stream.runForEachChunk(stream, sink.onSuccess), sink.onFailure))
}
