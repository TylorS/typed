import { dualWithTrace } from '@effect/data/Debug'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

export const matchInterruptCause: {
  <E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
    onCause: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    onInterrupt: () => Effect.Effect<R3, E3, C>,
    onSuccess: (a: A) => Effect.Effect<R4, E4, D>,
  ): <R>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R | R2 | R3 | R4, E2 | E3 | E4, B | C | D>
  <R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
    effect: Effect.Effect<R, E, A>,
    onCause: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    onInterrupt: () => Effect.Effect<R3, E3, C>,
    onSuccess: (a: A) => Effect.Effect<R4, E4, D>,
  ): Effect.Effect<R | R2 | R3 | R4, E2 | E3 | E4, B | C | D>
} = dualWithTrace(
  4,
  (trace) =>
    <R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
      effect: Effect.Effect<R, E, A>,
      onCause: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
      onInterrupt: () => Effect.Effect<R3, E3, C>,
      onSuccess: (a: A) => Effect.Effect<R4, E4, D>,
    ): Effect.Effect<R | R2 | R3 | R4, E2 | E3 | E4, B | C | D> =>
      Effect.matchCauseEffect(effect, splitInterrupt(onCause, onInterrupt), onSuccess).traced(
        trace,
      ),
)

export const splitInterrupt: {
  <E, R2, E2, B, R3, E3, C>(
    onCause: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    onInterrupt: () => Effect.Effect<R3, E3, C>,
  ): (cause: Cause.Cause<E>) => Effect.Effect<R2 | R3, E2 | E3, B | C>
  <E, R2, E2, B, R3, E3, C>(
    cause: Cause.Cause<E>,
    onCause: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    onInterrupt: () => Effect.Effect<R3, E3, C>,
  ): Effect.Effect<R2 | R3, E2 | E3, B | C>
} = dualWithTrace(
  3,
  (trace) =>
    <E, R2, E2, B, R3, E3, C>(
      cause: Cause.Cause<E>,
      onCause: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
      onInterrupt: () => Effect.Effect<R3, E3, C>,
    ): Effect.Effect<R2 | R3, E2 | E3, B | C> =>
      (Cause.isInterruptedOnly(cause) ? onInterrupt() : onCause(cause)).traced(trace),
)
