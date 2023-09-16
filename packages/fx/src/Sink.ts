/**
 * Sink is a data structure that represents a place to send failures and successes
 * over time in an effectful manner.
 * @since 1.18.0
 */

import type * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import type { Context } from "@typed/context"

/**
 * Sink is a data structure that represents a place to send failures and successes
 * over time in an effectful manner.
 * @since 1.18.0
 */
export interface Sink<E, A> extends WithContext<never, E, A> {}

/**
 * Construct a Sink that can be used to handle failures and successes.
 * @since 1.18.0
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
 */
export interface WithContext<R, E, A> {
  readonly onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R, never, unknown>
  readonly onSuccess: (a: A) => Effect.Effect<R, never, unknown>
}

/**
 * Construct a Sink that can be used to handle failures and successes with a Context.
 * @since 1.18.0
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
 */
export interface WithEarlyExit<E, A> extends Sink<E, A> {
  readonly earlyExit: Effect.Effect<never, never, void>
}
