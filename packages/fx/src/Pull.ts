/**
 * Pull is a data-type that really comes from the @effect/stream package, using
 * `Stream.toPull(stream)` to convert a Stream into an Effect which can be used
 * to read chunks of data from the Stream that are ready. This makes it a key part
 * of converting an Fx into a Stream.
 * @since 1.18.0
 */

import * as Cause from "effect/Cause"
import type * as Chunk from "effect/Chunk"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import { dual } from "effect/Function"
import * as Option from "effect/Option"
import type * as Schedule from "effect/Schedule"
import type { Sink } from "./Sink.js"

/**
 * An Effect which can be used to pull values of a Stream.
 * @since 1.18.0
 */
export interface Pull<out R, out E, out A> extends Effect.Effect<Chunk.Chunk<A>, Option.Option<E>, R> {}

function schedulePull<R, E, A, R2, R3>(
  pull: Pull<R, E, A>,
  f: (effect: Effect.Effect<unknown, never, R | R3>) => Effect.Effect<unknown, never, R2>,
  sink: Sink<A, E, R3>
): Effect.Effect<void, never, R2> {
  return Effect.asyncEffect<void, never, never, void, never, R2>((resume) =>
    pull.pipe(
      Effect.matchCauseEffect({
        onFailure: (cause: Cause.Cause<Option.Option<E>>) =>
          Cause.failureOrCause(cause).pipe(
            Either.match({
              onLeft: Option.match({
                onNone: () => Effect.sync(() => resume(Effect.unit)),
                onSome: (e: E) => sink.onFailure(Cause.fail(e))
              }),
              onRight: sink.onFailure
            })
          ),
        onSuccess: (chunk) => Effect.forEach(chunk, sink.onSuccess)
      }),
      f,
      Effect.flatMap(() => Effect.sync(() => resume(Effect.unit)))
    )
  )
}

/**
 * Schedule the values of a Pull to be pushed into a Sink
 * using Effect.schedule.
 * @since 1.18.0
 */
export const schedule: {
  <R2, R3, E, A>(
    schedule: Schedule.Schedule<R2, unknown, unknown>,
    sink: Sink<A, E, R3>
  ): <R>(pull: Pull<R, E, A>) => Effect.Effect<unknown, never, R | R2 | R3>

  <R, E, A, R2, R3>(
    pull: Pull<R, E, A>,
    schedule: Schedule.Schedule<R2, unknown, unknown>,
    sink: Sink<A, E, R3>
  ): Effect.Effect<unknown, never, R | R2 | R3>
} = dual(3, function schedule<R, E, A, R2, R3>(
  pull: Pull<R, E, A>,
  schedule: Schedule.Schedule<R2, unknown, unknown>,
  sink: Sink<A, E, R3>
): Effect.Effect<void, never, R | R2 | R3> {
  return schedulePull(pull, Effect.schedule(schedule), sink)
})

/**
 * Schedule the values of a Pull to be pushed into a Sink
 * using Effect.repeat.
 * @since 1.18.0
 */
export const repeat: {
  <R2, R3, E, A>(
    schedule: Schedule.Schedule<R2, unknown, unknown>,
    sink: Sink<A, E, R3>
  ): <R>(pull: Pull<R, E, A>) => Effect.Effect<unknown, never, R | R2 | R3>

  <R, E, A, R2, R3>(
    pull: Pull<R, E, A>,
    schedule: Schedule.Schedule<R2, unknown, unknown>,
    sink: Sink<A, E, R3>
  ): Effect.Effect<unknown, never, R | R2 | R3>
} = dual(3, function repeat<R, E, A, R2, R3>(
  pull: Pull<R, E, A>,
  schedule: Schedule.Schedule<R2, unknown, unknown>,
  sink: Sink<A, E, R3>
): Effect.Effect<void, never, R | R2 | R3> {
  return schedulePull(pull, Effect.repeat(schedule), sink)
})
