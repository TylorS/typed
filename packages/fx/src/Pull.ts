/**
 * Pull is a data-type that really comes from the @effect/stream package, using
 * `Stream.toPull(stream)` to convert a Stream into an Effect which can be used
 * to read chunks of data from the Stream that are ready. This makes it a key part
 * of converting an Fx into a Stream.
 * @since 1.18.0
 */

import type * as Chunk from "@effect/data/Chunk"
import * as Either from "@effect/data/Either"
import { dual } from "@effect/data/Function"
import * as Option from "@effect/data/Option"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import type * as Schedule from "@effect/io/Schedule"
import type { WithContext } from "@typed/fx/Sink"

/**
 * An Effect which can be used to pull values of a Stream.
 * @since 1.18.0
 */
export interface Pull<R, E, A> extends Effect.Effect<R, Option.Option<E>, Chunk.Chunk<A>> {}

/**
 * Schedule the values of a Pull to be pushed into a Sink.
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
} = dual(3, function schedulePull<R, E, A, R2, R3>(
  pull: Pull<R, E, A>,
  schedule: Schedule.Schedule<R2, unknown, unknown>,
  sink: WithContext<R3, E, A>
): Effect.Effect<R | R2 | R3, never, void> {
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
      Effect.repeat(schedule),
      Effect.flatMap(() => Effect.sync(() => resume(Effect.unit)))
    )
  )
})
