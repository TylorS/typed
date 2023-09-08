import type { Cause } from "@effect/io/Cause"
import { type Effect, provideContext } from "@effect/io/Effect"
import type { Context } from "@typed/context"

export interface Sink<E, A> {
  readonly name: string
  readonly onFailure: (cause: Cause<E>) => Effect<never, never, unknown>
  readonly onSuccess: (a: A) => Effect<never, never, unknown>
}

export function Sink<E, A>(
  name: string,
  onFailure: (cause: Cause<E>) => Effect<never, never, unknown>,
  onSuccess: (a: A) => Effect<never, never, unknown>
): Sink<E, A> {
  return {
    name,
    onFailure,
    onSuccess
  }
}

export namespace Sink {
  export type Error<T> = T extends Sink<infer E, any> ? E : never
  export type Success<T> = T extends Sink<any, infer A> ? A : never
}

export interface WithContext<R, E, A> {
  readonly name: string
  readonly onFailure: (cause: Cause<E>) => Effect<R, never, unknown>
  readonly onSuccess: (a: A) => Effect<R, never, unknown>
}

export function WithContext<R, E, A>(
  name: string,
  onFailure: (cause: Cause<E>) => Effect<R, never, unknown>,
  onSuccess: (a: A) => Effect<R, never, unknown>
): WithContext<R, E, A> {
  return {
    name,
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
    sink.name,
    (cause) => provideContext(sink.onFailure(cause), ctx),
    (a) => provideContext(sink.onSuccess(a), ctx)
  )
}
