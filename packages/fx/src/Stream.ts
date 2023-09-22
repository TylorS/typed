/**
 * Additional Stream integrations with Fx.
 * @since 1.18.0
 */
import * as Chunk from "@effect/data/Chunk"
import * as Option from "@effect/data/Option"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Exit from "@effect/io/Exit"
import * as Queue from "@effect/io/Queue"
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
 * Convert an Fx to a Stream using a Queue to buffer values
 * that have not yet been pulled.
 * @since 1.18.0
 * @category conversions
 */
export function toStreamQueued<R, E, A, R2, E2>(
  fx: Fx.Fx<R, E, A>,
  make: Effect.Effect<R2, E2, Queue.Queue<Exit.Exit<Option.Option<E>, A>>>
): Stream.Stream<R | R2, E | E2, A> {
  return Stream.flattenExitOption(Stream.unwrapScoped(Effect.gen(function*(_) {
    const queue = yield* _(make)

    yield* _(
      fx,
      Fx.mapError(Option.some),
      Fx.exit,
      Fx.toEnqueue(queue),
      Effect.ensuring(queue.offer(Exit.fail(Option.none()))),
      Effect.forkScoped
    )

    return Stream.fromQueue(queue)
  })))
}

/**
 * Convert an Fx to a Stream using a sliding Queue to buffer values
 * that have not yet been pulled.
 * @since 1.18.0
 * @category conversions
 */
export function toStreamSliding<R, E, A>(fx: Fx.Fx<R, E, A>, capacity: number = 1): Stream.Stream<R, E, A> {
  return toStreamQueued(fx, Queue.sliding(capacity))
}

/**
 * Convert an Fx to a Stream using a dropping Queue to buffer values
 * that have not yet been pulled.
 * @since 1.18.0
 * @category conversions
 */
export function toStreamDropping<R, E, A>(fx: Fx.Fx<R, E, A>, capacity: number = 1): Stream.Stream<R, E, A> {
  return toStreamQueued(fx, Queue.dropping(capacity))
}

/**
 * Convert an Fx to a Stream using a bounded Queue to buffer values
 * that have not yet been pulled.
 * @since 1.18.0
 * @category conversions
 */
export function toStreamBounded<R, E, A>(fx: Fx.Fx<R, E, A>, capacity: number = 1): Stream.Stream<R, E, A> {
  return toStreamQueued(fx, Queue.bounded(capacity))
}

/**
 * Convert a Stream to an Fx of chunks
 * @since 1.18.0
 * @category conversions
 */
export function chunked<R, E, A>(stream: Stream.Stream<R, E, A>): Fx.Fx<R, E, Chunk.Chunk<A>> {
  return Fx.fromSink((sink) => Effect.catchAllCause(Stream.runForEachChunk(stream, sink.onSuccess), sink.onFailure))
}
