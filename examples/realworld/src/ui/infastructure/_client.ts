import type { JwtToken } from "@/model"
import { Unauthorized, Unprocessable } from "@/services/errors"
import { getCurrentJwtToken } from "@/ui/services/CurrentUser"
import { Effect, Unify } from "effect"
import type { ClientError } from "effect-http"

export type ClientResponseToSuccess<T> = T extends { readonly status: 200; readonly content: infer A } ? A :
  T extends { readonly status: 201; readonly content: infer A } ? A
  : T extends { readonly status: 401 } ? never :
  T extends { readonly status: 422; readonly content: { readonly errors: ReadonlyArray<string> } } ? never
  : void

export type ClientResponseToError<T> = T extends { readonly status: 401 } ? Unauthorized :
  T extends { readonly status: 422; readonly content: { readonly errors: ReadonlyArray<string> } } ? Unprocessable :
  never

export function handleClientRequest<
  T extends { readonly status: number },
  E,
  R,
  O = ClientResponseToSuccess<T>
>(
  effect: Effect.Effect<T, E | ClientError.ClientError, R>,
  f?: (response: ClientResponseToSuccess<T>) => O
): Effect.Effect<O, Exclude<E, ClientError.ClientError> | ClientResponseToError<T>, R> {
  return effect.pipe(
    Effect.catchTag(
      "ClientError" as any,
      (error) => Effect.fail(new Unprocessable({ errors: [(error as ClientError.ClientError).message] }))
    ),
    Effect.flatMap(Unify.unify((response: T) => {
      if (response.status === 401) return Effect.fail(new Unauthorized())
      if (response.status === 422) {
        return Effect.fail(new Unprocessable((response as any).content.errors))
      }

      const content = (response as any).content

      if (f) {
        return Effect.succeed(f(content))
      } else {
        return Effect.succeed(content as O)
      }
    })) as any
  )
}

export const withJwtToken = <A, E, R>(f: (jwtToken: JwtToken) => Effect.Effect<A, E, R>) =>
  Effect.flatMap(getCurrentJwtToken, f)
