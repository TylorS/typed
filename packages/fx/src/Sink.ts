import type * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import type { Context } from "@typed/context"

export interface Sink<E, A> extends WithContext<never, E, A> {}

export function Sink<E, A>(
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<never, never, unknown>,
  onSuccess: (a: A) => Effect.Effect<never, never, unknown>
): Sink<E, A> {
  return {
    onFailure,
    onSuccess
  }
}

export namespace Sink {
  export type Error<T> = T extends Sink<infer E, any> ? E : never
  export type Success<T> = T extends Sink<any, infer A> ? A : never
}

export interface WithContext<R, E, A> {
  readonly onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R, never, unknown>
  readonly onSuccess: (a: A) => Effect.Effect<R, never, unknown>
}

export function WithContext<R, E, A, R2>(
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R, never, unknown>,
  onSuccess: (a: A) => Effect.Effect<R2, never, unknown>
): WithContext<R | R2, E, A> {
  return {
    onFailure,
    onSuccess
  }
}

export namespace WithContext {
  export type Context<T> = T extends WithContext<infer R, any, any> ? R : never
  export type Error<T> = T extends WithContext<any, infer E, any> ? E : never
  export type Success<T> = T extends WithContext<any, any, infer A> ? A : never
}

export function provide<R, E, A>(sink: WithContext<R, E, A>, ctx: Context<R>): Sink<E, A> {
  return Sink(
    (cause) => Effect.provideContext(sink.onFailure(cause), ctx),
    (a) => Effect.provideContext(sink.onSuccess(a), ctx)
  )
}

export interface WithEarlyExit<E, A> extends Sink<E, A> {
  readonly earlyExit: Effect.Effect<never, never, void>
}
