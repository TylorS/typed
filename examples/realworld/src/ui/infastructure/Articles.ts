import { client } from "@/api/client"
import { Articles } from "@/services"
import { Unauthorized, Unprocessable } from "@/services/errors"
import { getCurrentJwtToken } from "@/ui/services"
import { Effect, Unify } from "effect"
import type { ClientError } from "effect-http"

export const ArticlesLive = Articles.implement({
  get: (input) => handleClientRequest(client.getArticle({ params: input }), (r) => r.article),
  create: (input) =>
    handleClientRequest(
      Effect.gen(function*(_) {
        const jwtToken = yield* _(getCurrentJwtToken)
        return yield* _(client.createArticle({ body: { article: input } }, { jwtToken }))
      }),
      (r) => r.article
    ),
  update: (slug, input) =>
    handleClientRequest(
      Effect.gen(function*(_) {
        const jwtToken = yield* _(getCurrentJwtToken)
        return yield* _(client.updateArticle({ params: { slug }, body: { article: input } }, { jwtToken }))
      }),
      (r) => r.article
    ),
  delete: (input) =>
    handleClientRequest(
      Effect.gen(function*(_) {
        const jwtToken = yield* _(getCurrentJwtToken)
        return yield* _(client.deleteArticle({ params: input }, { jwtToken }))
      })
    ),
  list: (input) => handleClientRequest(client.getArticles({ params: input }), (r) => r.articles),
  feed: (input) => handleClientRequest(client.getFeed({ params: input }), (r) => r.articles),
  favorite: (slug) =>
    handleClientRequest(
      Effect.gen(function*(_) {
        const jwtToken = yield* _(getCurrentJwtToken)
        return yield* _(client.favorite({ params: { slug } }, { jwtToken }))
      }),
      (r) => r.article
    ),
  unfavorite: (slug) =>
    handleClientRequest(
      Effect.gen(function*(_) {
        const jwtToken = yield* _(getCurrentJwtToken)
        return yield* _(client.unfavorite({ params: { slug } }, { jwtToken }))
      }),
      (r) => r.article
    )
})

type ClientResponseToSuccess<T> = T extends { readonly status: 200; readonly content: infer A } ? A :
  T extends { readonly status: 201; readonly content: infer A } ? A
  : T extends { readonly status: 401 } ? never :
  T extends { readonly status: 422; readonly content: { readonly errors: ReadonlyArray<string> } } ? never
  : void

type ClientResponseToError<T> = T extends { readonly status: 401 } ? Unauthorized :
  T extends { readonly status: 422; readonly content: { readonly errors: ReadonlyArray<string> } } ? Unprocessable :
  never

function handleClientRequest<
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
      (error) => Effect.fail(new Unprocessable([(error as ClientError.ClientError).message]))
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
