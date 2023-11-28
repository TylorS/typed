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
import type { WithContext } from "./Sink.js"

/**
 * An Effect which can be used to pull values of a Stream.
 * @since 1.18.0
 */
export interface Pull<R, E, A> extends Effect.Effect<R, Option.Option<E>, Chunk.Chunk<A>> {}

function schedulePull<R, E, A, R2, R3>(
  pull: Pull<R, E, A>,
  f: (effect: Effect.Effect<R | R3, never, unknown>) => Effect.Effect<R2, never, unknown>,
  sink: WithContext<R3, E, A>
): Effect.Effect<R2, never, void> {
  return Effect.asyncEffect((resume) =>
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
    sink: WithContext<R3, E, A>
  ): <R>(pull: Pull<R, E, A>) => Effect.Effect<R | R2 | R3, never, unknown>

  <R, E, A, R2, R3>(
    pull: Pull<R, E, A>,
    schedule: Schedule.Schedule<R2, unknown, unknown>,
    sink: WithContext<R3, E, A>
  ): Effect.Effect<R | R2 | R3, never, unknown>
} = dual(3, function schedule<R, E, A, R2, R3>(
  pull: Pull<R, E, A>,
  schedule: Schedule.Schedule<R2, unknown, unknown>,
  sink: WithContext<R3, E, A>
): Effect.Effect<R | R2 | R3, never, void> {
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
    sink: WithContext<R3, E, A>
  ): <R>(pull: Pull<R, E, A>) => Effect.Effect<R | R2 | R3, never, unknown>

  <R, E, A, R2, R3>(
    pull: Pull<R, E, A>,
    schedule: Schedule.Schedule<R2, unknown, unknown>,
    sink: WithContext<R3, E, A>
  ): Effect.Effect<R | R2 | R3, never, unknown>
} = dual(3, function repeat<R, E, A, R2, R3>(
  pull: Pull<R, E, A>,
  schedule: Schedule.Schedule<R2, unknown, unknown>,
  sink: WithContext<R3, E, A>
): Effect.Effect<R | R2 | R3, never, void> {
  return schedulePull(pull, Effect.repeat(schedule), sink)
})
