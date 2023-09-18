/**
 * Sink is a data structure that represents a place to send failures and successes
 * over time in an effectful manner.
 * @since 1.18.0
 */

import * as Either from "@effect/data/Either"
import { dual } from "@effect/data/Function"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import type { Context } from "@typed/context"

/**
 * Sink is a data structure that represents a place to send failures and successes
 * over time in an effectful manner.
 * @since 1.18.0
 * @category models
 */
export interface Sink<E, A> extends WithContext<never, E, A> {}

/**
 * Construct a Sink that can be used to handle failures and successes.
 * @since 1.18.0
 * @category constructors
 */
export function Sink<E, A>(
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<never, never, unknown>,
  onSuccess: (a: A) => Effect.Effect<never, never, unknown>
): Sink<E, A> {
  return {
    onFailure,
    onSuccess
  }
}

/**
 * @since 1.18.0
 */
export namespace Sink {
  /**
   * Extract the Error type from a Sink
   * @since 1.18.0
   */
  export type Error<T> = T extends Sink<infer E, any> ? E : never

  /**
   * Extract the Success type from a Sink
   * @since 1.18.0
   */
  export type Success<T> = T extends Sink<any, infer A> ? A : never
}

/**
 * A Sink that can be used to handle failures and successes with a Context.
 * @since 1.18.0
 * @category models
 */
export interface WithContext<R, E, A> {
  readonly onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R, never, unknown>
  readonly onSuccess: (a: A) => Effect.Effect<R, never, unknown>
}

/**
 * Construct a Sink that can be used to handle failures and successes with a Context.
 * @since 1.18.0
 * @category constructors
 */
export function WithContext<R, E, A, R2>(
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R, never, unknown>,
  onSuccess: (a: A) => Effect.Effect<R2, never, unknown>
): WithContext<R | R2, E, A> {
  return {
    onFailure,
    onSuccess
  }
}

/**
 * @since 1.18.0
 */
export namespace WithContext {
  /**
   * Extract the Context type from a Sink
   * @since 1.18.0
   */
  export type Context<T> = T extends WithContext<infer R, any, any> ? R : never

  /**
   * Extract the Error type from a Sink
   * @since 1.18.0
   */
  export type Error<T> = T extends WithContext<any, infer E, any> ? E : never

  /**
   * Extract the Success type from a Sink
   * @since 1.18.0
   */
  export type Success<T> = T extends WithContext<any, any, infer A> ? A : never
}

/**
 * Provide a Context to a Sink
 * @since 1.18.0
 * @category context
 */
export function provide<R, E, A>(sink: WithContext<R, E, A>, ctx: Context<R>): Sink<E, A> {
  return Sink(
    (cause) => Effect.provideContext(sink.onFailure(cause), ctx),
    (a) => Effect.provideContext(sink.onSuccess(a), ctx)
  )
}

/**
 * A Sink which can be utilized to exit early from an Fx.
 * Useful for operators the end the stream early.
 * @since 1.18.0
 * @category models
 */
export interface WithEarlyExit<E, A> extends Sink<E, A> {
  readonly earlyExit: Effect.Effect<never, never, void>
}

/**
 * Transform the input value of a Sink.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <B, A>(f: (b: B) => A): <E>(sink: Sink<E, A>) => Sink<E, B>
  <E, A, B>(sink: Sink<E, A>, f: (b: B) => A): Sink<E, B>
} = dual(2, function map<E, A, B>(
  sink: Sink<E, A>,
  f: (b: B) => A
): Sink<E, B> {
  return Sink(
    sink.onFailure,
    (a) => sink.onSuccess(f(a))
  )
})

/**
 * Transform the input value of a Sink using an Effect.
 * @since 1.18.0
 * @category combinators
 */
export const mapEffect: {
  <B, R2, E, A>(f: (b: B) => Effect.Effect<R2, E, A>): (sink: Sink<E, A>) => WithContext<R2, E, B>
  <E, A, R2, B>(sink: Sink<E, A>, f: (b: B) => Effect.Effect<R2, E, A>): WithContext<R2, E, B>
} = dual(2, function mapEffect<E, A, R2, B>(
  sink: Sink<E, A>,
  f: (b: B) => Effect.Effect<R2, E, A>
): WithContext<R2, E, B> {
  return WithContext(
    sink.onFailure,
    (b) => Effect.matchCauseEffect(f(b), sink)
  )
})

/**
 * Transform the input Cause of a Sink.
 * @since 1.18.0
 * @category combinators
 */
export const mapErrorCause: {
  <E2, E, A>(f: (e: Cause.Cause<E2>) => Cause.Cause<E>): (sink: Sink<E, A>) => Sink<E2, A>
  <E, A, E2>(sink: Sink<E, A>, f: (e: Cause.Cause<E2>) => Cause.Cause<E>): Sink<E2, A>
} = dual(2, function mapErrorCause<E, A, E2>(
  sink: Sink<E, A>,
  f: (e: Cause.Cause<E2>) => Cause.Cause<E>
): Sink<E2, A> {
  return Sink(
    (cause) => sink.onFailure(f(cause)),
    sink.onSuccess
  )
})

/**
 * Transform the input Cause of a Sink using an Effect.
 * @since 1.18.0
 * @category combinators
 */
export const mapErrorCauseEffect: {
  <E2, R2, E, A>(
    f: (e: Cause.Cause<E2>) => Effect.Effect<R2, E, Cause.Cause<E>>
  ): (sink: Sink<E, A>) => WithContext<R2, E2, A>
  <E, A, R2, E2>(
    sink: Sink<E, A>,
    f: (e: Cause.Cause<E2>) => Effect.Effect<R2, E, Cause.Cause<E>>
  ): WithContext<R2, E2, A>
} = dual(2, function mapErrorCauseEffect<E, A, R2, E2>(
  sink: Sink<E, A>,
  f: (e: Cause.Cause<E2>) => Effect.Effect<R2, E, Cause.Cause<E>>
): WithContext<R2, E2, A> {
  return WithContext(
    (cause) => Effect.matchCauseEffect(f(cause), Sink(sink.onFailure, sink.onFailure)),
    sink.onSuccess
  )
})

/**
 * Transform the input Error of a Sink.
 * @since 1.18.0
 * @category combinators
 */
export const mapError: {
  <E2, E, A>(f: (e: E2) => E): (sink: Sink<E, A>) => Sink<E2, A>
  <E, A, E2>(sink: Sink<E, A>, f: (e: E2) => E): Sink<E2, A>
} = dual(2, function mapError<E, A, E2>(
  sink: Sink<E, A>,
  f: (e: E2) => E
): Sink<E2, A> {
  return Sink(
    (cause) => sink.onFailure(Cause.map(cause, f)),
    sink.onSuccess
  )
})

/**
 * Transform the input Error of a Sink using an Effect.
 * @since 1.18.0
 * @category combinators
 */
export const mapErrorEffect: {
  <E2, R2, E, A>(f: (e: E2) => Effect.Effect<R2, E, E>): (sink: Sink<E, A>) => WithContext<R2, E, A>
  <E, A, R2, E2>(sink: Sink<E, A>, f: (e: E2) => Effect.Effect<R2, E, E>): WithContext<R2, E, A>
} = dual(2, function mapErrorEffect<E, A, R2, E2>(
  sink: Sink<E, A>,
  f: (e: E2) => Effect.Effect<R2, E, E>
): WithContext<R2, E2, A> {
  return mapErrorCauseEffect(sink, (cause: Cause.Cause<E2>) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e2) => Effect.map(f(e2), Cause.fail),
      onRight: (cause) => Effect.succeed(cause)
    }))
})
