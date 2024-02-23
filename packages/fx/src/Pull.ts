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
export interface Pull<out A, out E = never, out R = never> extends Effect.Effect<Chunk.Chunk<A>, Option.Option<E>, R> {}

function schedulePull<A, E, R, R2, R3>(
  pull: Pull<A, E, R>,
  f: (effect: Effect.Effect<unknown, never, R | R3>) => Effect.Effect<unknown, never, R2>,
  sink: Sink<A, E, R3>
): Effect.Effect<void, never, R2> {
  return Effect.asyncEffect<void, never, never, R2, never, R2>((resume) =>
    Effect.matchCauseEffect(pull, {
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
      onSuccess: (chunk: Chunk.Chunk<A>) => Effect.forEach(chunk, sink.onSuccess, { discard: true })
    }).pipe(
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
  <R2, A, E, R3>(
    schedule: Schedule.Schedule<unknown, unknown, R2>,
    sink: Sink<A, E, R3>
  ): <R>(pull: Pull<A, E, R>) => Effect.Effect<unknown, never, R | R2 | R3>

  <A, E, R, R2, R3>(
    pull: Pull<A, E, R>,
    schedule: Schedule.Schedule<unknown, unknown, R2>,
    sink: Sink<A, E, R3>
  ): Effect.Effect<unknown, never, R | R2 | R3>
} = dual(3, function schedule<A, E, R, R2, R3>(
  pull: Pull<A, E, R>,
  schedule: Schedule.Schedule<unknown, unknown, R2>,
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
  <R2, A, E, R3>(
    schedule: Schedule.Schedule<unknown, unknown, R2>,
    sink: Sink<A, E, R3>
  ): <R>(pull: Pull<A, E, R>) => Effect.Effect<unknown, never, R | R2 | R3>

  <A, E, R, R2, R3>(
    pull: Pull<A, E, R>,
    schedule: Schedule.Schedule<unknown, unknown, R2>,
    sink: Sink<A, E, R3>
  ): Effect.Effect<unknown, never, R | R2 | R3>
} = dual(3, function repeat<A, E, R, R2, R3>(
  pull: Pull<A, E, R>,
  schedule: Schedule.Schedule<unknown, unknown, R2>,
  sink: Sink<A, E, R3>
): Effect.Effect<void, never, R | R2 | R3> {
  return schedulePull(pull, Effect.repeat(schedule), sink)
})
