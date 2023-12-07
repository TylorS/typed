import { Effect, Option } from "effect"
import type { Cause, Predicate } from "effect"
import { dual } from "effect/Function"

export interface Sink<out R, in E, in A> {
  readonly onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R, never, unknown>
  readonly onSuccess: (value: A) => Effect.Effect<R, never, unknown>
}

export function make<E, R, A, R2>(
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R, never, unknown>,
  onSuccess: (value: A) => Effect.Effect<R2, never, unknown>
): Sink<R | R2, E, A> {
  return {
    onFailure,
    onSuccess
  }
}

/**
 * A Sink which can be utilized to exit early from an Fx.
 * Useful for operators the end the stream early.
 * @since 1.18.0
 * @category models
 */
export interface WithEarlyExit<R, E, A> extends Sink<R, E, A> {
  readonly earlyExit: Effect.Effect<never, never, void>
}

export function withEarlyExit<R, E, A, R2, B>(
  sink: Sink<R, E, A>,
  f: (sink: WithEarlyExit<R, E, A>) => Effect.Effect<R2, E, B>
): Effect.Effect<R | R2, never, void> {
  return Effect.asyncEffect<never, never, void, R | R2, never, void>((resume) => {
    const earlyExit: WithEarlyExit<R, E, A> = {
      ...sink,
      earlyExit: Effect.sync(() => resume(Effect.unit))
    }

    return Effect.matchCauseEffect(f(earlyExit), {
      onFailure: sink.onFailure,
      onSuccess: () => earlyExit.earlyExit
    })
  })
}

/**
 * Transform the input value of a Sink.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <B, A>(f: (b: B) => A): <R, E>(sink: Sink<R, E, A>) => Sink<R, E, B>
  <R, E, A, B>(sink: Sink<R, E, A>, f: (b: B) => A): Sink<R, E, B>
} = dual(2, function map<R, E, A, B>(
  sink: Sink<R, E, A>,
  f: (b: B) => A
): Sink<R, E, B> {
  return make(
    sink.onFailure,
    (a) => sink.onSuccess(f(a))
  )
})

export function filter<R, E, A>(sink: Sink<R, E, A>, predicate: Predicate.Predicate<A>): Sink<R, E, A> {
  return make(
    sink.onFailure,
    (a) => predicate(a) ? sink.onSuccess(a) : Effect.unit
  )
}

export function filterMap<R, E, A, B>(sink: Sink<R, E, B>, predicate: (a: A) => Option.Option<B>): Sink<R, E, A> {
  return make(
    sink.onFailure,
    (a) => {
      const b = predicate(a)
      if (Option.isSome(b)) return sink.onSuccess(b.value)
      else return Effect.unit
    }
  )
}
