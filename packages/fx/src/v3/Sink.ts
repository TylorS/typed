import { Effect, Option } from "effect"
import type { Cause, Predicate } from "effect"
import { dual } from "effect/Function"

export interface Sink<out R, in E, in A> {
  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown>
  onSuccess(value: A): Effect.Effect<R, never, unknown>
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
  return new MapSink(sink, f)
})

class MapSink<R, E, A, B> implements Sink<R, E, A> {
  constructor(
    readonly sink: Sink<R, E, B>,
    readonly f: (a: A) => B
  ) {}

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(this.f(value))
  }
}

export function filter<R, E, A>(sink: Sink<R, E, A>, predicate: Predicate.Predicate<A>): Sink<R, E, A> {
  return new FilterSink(sink, predicate)
}

class FilterSink<R, E, A> implements Sink<R, E, A> {
  constructor(
    readonly sink: Sink<R, E, A>,
    readonly predicate: Predicate.Predicate<A>
  ) {}

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    if (this.predicate(value)) return this.sink.onSuccess(value)
    else return Effect.unit
  }
}

export function filterMap<R, E, A, B>(sink: Sink<R, E, B>, f: (a: A) => Option.Option<B>): Sink<R, E, A> {
  return new FilterMapSink(sink, f)
}

class FilterMapSink<R, E, A, B> implements Sink<R, E, A> {
  constructor(
    readonly sink: Sink<R, E, B>,
    readonly f: (a: A) => Option.Option<B>
  ) {}

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    const option = this.f(value)
    if (Option.isSome(option)) return this.sink.onSuccess(option.value)
    else return Effect.unit
  }
}

// TODO: Effect operators
// TODO: Loop operators
// TODO: Snapshot operators
// TODO: Higher-order operators
