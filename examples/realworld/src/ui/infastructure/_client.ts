import type { JwtToken } from "@/model"
import { getCurrentJwtToken } from "@/services/CurrentUser"
import { Unauthorized, Unprocessable } from "@/services/errors"
import { Effect, Unify } from "effect"
import type { ClientError } from "effect-http"
import type { Ignored } from "effect-http/ApiSchema"

export type ClientResponseToSuccess<T> = T extends { readonly status: 200; readonly body: infer A } ?
  Exclude<A, Ignored> :
  T extends { readonly status: 201; readonly body: infer A } ? Exclude<A, Ignored>
  : void

export function handleClientRequest<
  T extends { readonly status: number; readonly body: any },
  E,
  R,
  O = ClientResponseToSuccess<T>
>(
  effect: Effect.Effect<T, E | ClientError.ClientError, R>,
  f?: (response: ClientResponseToSuccess<T>) => O
): Effect.Effect<O, Exclude<E, ClientError.ClientError>, R> {
  return effect.pipe(
    Effect.catchTag(
      "ClientError",
      Unify.unify((error: any) => {
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
    Effect.flatMap(Unify.unify(({ body }: T) => {
      if (f) {
        return Effect.succeed(f(body))
      } else {
        return Effect.succeed(body as O)
      }
    })) as any
  )
}

export const withJwtToken = <A, E, R>(f: (jwtToken: JwtToken) => Effect.Effect<A, E, R>) =>
  Effect.flatMap(getCurrentJwtToken, f)
