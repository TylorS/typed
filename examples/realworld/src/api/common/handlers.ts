import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import { ServerError } from "@typed/server"
import { Effect } from "effect"

export const STATUS_200 = { status: 200, body: undefined } as const

export function catchUnauthorized<R, E, A>(
  effect: Effect.Effect<R, E | Unauthorized, A>
): Effect.Effect<
  R,
  Exclude<E, { readonly _tag: "Unauthorized" }> | ServerError.ServerError,
  A
> {
  return Effect.catchTag(effect, "Unauthorized", () => ServerError.unauthorizedError(undefined))
}

export function catchUnprocessable<A, E, R>(
  effect: Effect.Effect<A, E | Unprocessable, R>
): Effect.Effect<
  A,
  Exclude<E, { readonly _tag: "Unprocessable" }> | ServerError.ServerError,
  R
> {
  return Effect.catchTag(
    effect,
    "Unprocessable",
    (e) => ServerError.makeJson(422, { errors: (e as Unprocessable).errors } as const)
  )
}

export function catchUnauthorizedAndUnprocessable<R, E, A>(
  effect: Effect.Effect<R, E | Unauthorized | Unprocessable, A>
): Effect.Effect<
  R,
  Exclude<Exclude<E, { readonly _tag: "Unprocessable" }>, { readonly _tag: "Unauthorized" }> | ServerError.ServerError,
  A
> {
  return catchUnauthorized(catchUnprocessable(effect))
}
