import type { JwtToken } from "@/model"
import { getCurrentJwtToken } from "@/services/CurrentUser"
import { Unauthorized, Unprocessable } from "@/services/errors"
import { Effect, Unify } from "effect"
import type { ClientError } from "effect-http"

type ExtractBody<A> = A extends { readonly body: infer B } ? B : A

export function handleClientRequest<
  A,
  E extends { readonly message: string },
  S extends number,
  R
>(
  effect: Effect.Effect<A, E | ClientError.ClientError<S>, R>
): Effect.Effect<
  ExtractBody<A>,
  | Exclude<E, ClientError.ClientError<S>>
  | (S extends 422 ? Unprocessable : never)
  | (S extends 401 ? Unauthorized : never),
  R
> {
  return Effect.map(
    Effect.catchTag(
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
    ),
    // TODO: This is honestly a hacky way to handle client requests, but the return types of the client are not quite correct
    // as it thinks that it returns `A`, but it's still `{ body: A }` so we need to extract the body here unsafely
    (r) => (r as any).body as A
  ) as any
}

export const withJwtToken = <A, E, R>(f: (jwtToken: JwtToken) => Effect.Effect<A, E, R>) =>
  Effect.flatMap(getCurrentJwtToken, f)
