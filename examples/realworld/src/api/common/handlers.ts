import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import { HttpError } from "@typed/server"
import { Effect } from "effect"

export const STATUS_200 = { status: 200, body: undefined } as const

export function catchUnauthorized<R, E, A>(
  effect: Effect.Effect<R, E | Unauthorized, A>
): Effect.Effect<
  R,
  Exclude<E, { readonly _tag: "Unauthorized" }> | HttpError.HttpError,
  A
> {
  return Effect.catchTag(effect, "Unauthorized", () => HttpError.unauthorizedError(undefined))
}

export function catchUnprocessable<A, E, R>(
  effect: Effect.Effect<A, E | Unprocessable, R>
): Effect.Effect<
  A,
  Exclude<E, { readonly _tag: "Unprocessable" }> | HttpError.HttpError,
  R
> {
  return Effect.catchTag(
    effect,
    "Unprocessable",
    (e) => HttpError.make(422, { errors: (e as Unprocessable).errors } as const)
  )
}

export function catchUnauthorizedAndUnprocessable<R, E, A>(
  effect: Effect.Effect<R, E | Unauthorized | Unprocessable, A>
): Effect.Effect<
  R,
  Exclude<Exclude<E, { readonly _tag: "Unprocessable" }>, { readonly _tag: "Unauthorized" }> | HttpError.HttpError,
  A
> {
  return catchUnauthorized(catchUnprocessable(effect))
}
