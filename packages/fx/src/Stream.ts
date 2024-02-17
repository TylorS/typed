/**
 * Additional Stream integrations with Fx.
 * @since 1.18.0
 */
import * as Cause from "effect/Cause"
import * as Chunk from "effect/Chunk"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { dual } from "effect/Function"
import * as Option from "effect/Option"
import * as Queue from "effect/Queue"
import type * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"
import * as Fx from "./Fx.js"
import * as Sink from "./Sink.js"

/**
 * Convert an Fx to a Stream
 * @since 1.18.0
 * @category conversions
 */
export function toStream<R, E, A>(fx: Fx.Fx<R, E, A>): Stream.Stream<A, E, R> {
  return Stream.asyncScoped<A, E, R | Scope.Scope>((emit) =>
    fx.run(
      Sink.make(
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
export const toStreamQueued: {
  <E, A, R2, E2>(
    make: Effect.Effect<Queue.Queue<Exit.Exit<A, Option.Option<E>>>, E2, R2>
  ): <R>(fx: Fx.Fx<R, E, A>) => Stream.Stream<A, E | E2, R | R2>

  <R, E, A, R2, E2>(
    fx: Fx.Fx<R, E, A>,
    make: Effect.Effect<Queue.Queue<Exit.Exit<A, Option.Option<E>>>, E2, R2>
  ): Stream.Stream<A, E | E2, R | R2>
} = dual(2, function toStreamQueued<R, E, A, R2, E2>(
  fx: Fx.Fx<R, E, A>,
  make: Effect.Effect<Queue.Queue<Exit.Exit<A, Option.Option<E>>>, E2, R2>
): Stream.Stream<A, E | E2, R | R2> {
  return make.pipe(
    Effect.tap((queue) =>
      fx.pipe(
        Fx.mapError(Option.some),
        Fx.exit,
        Fx.toEnqueue(queue),
        Effect.ensuring(queue.offer(Exit.fail(Option.none()))),
        Effect.forkScoped
      )
    ),
    Effect.map((queue) => Stream.fromQueue(queue)),
    Stream.unwrapScoped,
    Stream.flattenExitOption
  )
})

/**
 * Convert an Fx to a Stream using a sliding Queue to buffer values
 * that have not yet been pulled.
 * @since 1.18.0
 * @category conversions
 */
export const toStreamSliding: {
  (capacity: number): <R, E, A>(fx: Fx.Fx<R, E, A>) => Stream.Stream<A, E, R>
  <R, E, A>(fx: Fx.Fx<R, E, A>, capacity: number): Stream.Stream<A, E, R>
} = dual(
  2,
  function toStreamSliding<R, E, A>(fx: Fx.Fx<R, E, A>, capacity: number): Stream.Stream<A, E, R> {
    return toStreamQueued(fx, Queue.sliding(capacity))
  }
)

/**
 * Convert an Fx to a Stream using a dropping Queue to buffer values
 * that have not yet been pulled.
 * @since 1.18.0
 * @category conversions
 */
export const toStreamDropping: {
  (capacity: number): <R, E, A>(fx: Fx.Fx<R, E, A>) => Stream.Stream<A, E, R>
  <R, E, A>(fx: Fx.Fx<R, E, A>, capacity: number): Stream.Stream<A, E, R>
} = dual(
  2,
  function toStreamDropping<R, E, A>(fx: Fx.Fx<R, E, A>, capacity: number): Stream.Stream<A, E, R> {
    return toStreamQueued(fx, Queue.dropping(capacity))
  }
)

/**
 * Convert an Fx to a Stream using a bounded Queue to buffer values
 * that have not yet been pulled.
 * @since 1.18.0
 * @category conversions
 */
export const toStreamBounded: {
  (capacity: number): <R, E, A>(fx: Fx.Fx<R, E, A>) => Stream.Stream<A, E, R>
  <R, E, A>(fx: Fx.Fx<R, E, A>, capacity: number): Stream.Stream<A, E, R>
} = dual(
  2,
  function toStreamBounded<R, E, A>(fx: Fx.Fx<R, E, A>, capacity: number): Stream.Stream<A, E, R> {
    return toStreamQueued(fx, Queue.bounded(capacity))
  }
)

/**
 * Convert a Stream to an Fx
 * @since 1.18.0
 * @category conversions
 */
export function fromStream<R, E, A>(
  stream: Stream.Stream<A, E, R>
): Fx.Fx<R, E, A> {
  return Fx.make<R, E, A>((sink) => Effect.catchAllCause(Stream.runForEach(stream, sink.onSuccess), sink.onFailure))
}

/**
 * Convert a Stream to an Fx of chunks
 * @since 1.18.0
 * @category conversions
 */
export function fromStreamChunked<R, E, A>(stream: Stream.Stream<A, E, R>): Fx.Fx<R, E, Chunk.Chunk<A>> {
  return Fx.make<R, E, Chunk.Chunk<A>>((sink) =>
    Effect.catchAllCause(Stream.runForEachChunk(stream, sink.onSuccess), sink.onFailure)
  )
}
