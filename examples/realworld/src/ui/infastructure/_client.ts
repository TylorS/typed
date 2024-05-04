import type { ClientRequest } from "@effect/platform/Http/ClientRequest"
import { addJwtTokenToRequest, addOptionalJwtTokenToRequest } from "@realworld/api/common/spec"
import { getCurrentJwtToken } from "@realworld/services/CurrentUser"
import { Unauthorized, Unprocessable } from "@realworld/services/errors"
import type { ClientError } from "@typed/server"
import { Effect, Unify } from "effect"

export function handleClientRequest<
  A,
  E extends { readonly message: string },
  S extends number,
  R
>(
  effect: Effect.Effect<A, E | ClientError.ClientError<S>, R>
): Effect.Effect<
  A,
  | Exclude<E, ClientError.ClientError<S>>
  | (S extends 422 ? Unprocessable : never)
  | (S extends 401 ? Unauthorized : never),
  R
> {
  return Effect.catchTag(
    effect,
    "ClientError",
    Unify.unify((error) => {
      if ("status" in error) {
        switch (error.status) {
          case 401:
            return Effect.fail(new Unauthorized())
          case 422:
            return Effect.fail(new Unprocessable({ errors: (error.error as Unprocessable).errors }))
        }
      }
      return Effect.fail(new Unprocessable({ errors: [error.message] }))
    })
  ) as any
}

export const withJwtToken = <A, E, R>(f: (add: (request: ClientRequest) => ClientRequest) => Effect.Effect<A, E, R>) =>
  Effect.flatMap(getCurrentJwtToken, (token) => f(addJwtTokenToRequest(token)))

export const withOptionalJwtToken = <A, E, R>(
  f: (add: (request: ClientRequest) => ClientRequest) => Effect.Effect<A, E, R>
) =>
  Effect.flatMap(
    Effect.catchAllCause(Effect.asSome(getCurrentJwtToken), () => Effect.succeedNone),
    (token) => f(addOptionalJwtTokenToRequest(token))
  )
