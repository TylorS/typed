import { type Cause, Expected, findError } from "./Cause.js"
import * as Effect from "./Effect.js"
import { isRight } from "./Either.js"

export class Fail<const out E> extends Effect.service<never>("Fail")<Cause<E>> {}

export const failCause = <E = never>(e: Cause<E>): Effect.Effect<Fail<E>, never> => new Fail(e)

export const fail = <E>(error: E) => failCause(new Expected(error))

export namespace Fail {
  export type ExcludeAll<T> = T extends Fail<infer _> ? never : T
  export type Exclude<T, E> = T extends Fail<infer A> ? A extends E ? never : T : T
  export type Error<T> = T extends Fail<infer E> ? E : never
}

export const catchAllCause = <R, E, A, R2, B>(
  effect: Effect.Effect<R | Fail<E>, A>,
  f: (cause: Cause<E>) => Effect.Effect<R2, B>
): Effect.Effect<R2 | Fail.ExcludeAll<R>, A | B> => {
  return Effect.handle(effect, Fail, {
    handle: (fail) => Effect.map(f(fail.input as Cause<E>), Effect.resume)
  }) as any
}

export const catchAll = <R, E, A, R2, B>(
  effect: Effect.Effect<R | Fail<E>, A>,
  f: (e: E) => Effect.Effect<R2, B>
): Effect.Effect<R2 | Fail<never> | Exclude<R, Fail<E>>, A | B> => {
  return catchAllCause(effect, function catchError(cause: Cause<E>): Effect.Effect<R2 | Fail<never>, B> {
    const error = findError(cause)
    if (isRight(error)) {
      return failCause(error.right)
    } else {
      return f(error.left)
    }
  })
}
