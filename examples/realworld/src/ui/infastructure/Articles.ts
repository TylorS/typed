import { client } from "@/api/client"
import { Articles } from "@/services"
import { getCurrentJwtToken } from "@/ui/services"
import { Effect } from "effect"
import { handleClientRequest } from "./_client"

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
  list: (input) => handleClientRequest(client.getArticles({ query: input }), (r) => r.articles),
  feed: (input) => handleClientRequest(client.getFeed({ query: input }), (r) => r.articles),
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
