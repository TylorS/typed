import { client } from "@/api/client"
import { Articles } from "@/services"
import { Effect } from "effect"
import { handleClientRequest, withJwtToken } from "./_client"

export const ArticlesLive = Articles.implement({
  get: (input) => Effect.map(handleClientRequest(client.getArticle({ path: input })), (r) => r.article),
  create: (input) =>
    Effect.map(
      handleClientRequest(
        withJwtToken((jwtToken) => client.createArticle({ body: { article: input } }, { jwtToken }))
      ),
      (r) => r.article
    ),
  update: (slug, input) =>
    Effect.map(
      handleClientRequest(
        withJwtToken((jwtToken) => client.updateArticle({ path: { slug }, body: { article: input } }, { jwtToken }))
      ),
      (r) => r.article
    ),
  delete: (input) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.deleteArticle({ path: input }, { jwtToken }))
    ),
  list: (input) =>
    Effect.map(
      handleClientRequest(client.getArticles({ query: input })),
      (r) => r.articles
    ),
  feed: (input) =>
    Effect.map(
      handleClientRequest(withJwtToken((jwtToken) => client.getFeed({ query: input }, { jwtToken }))),
      (r) => r.articles
    ),
  favorite: (slug) =>
    Effect.map(
      handleClientRequest(
        withJwtToken((jwtToken) => client.favorite({ path: { slug } }, { jwtToken }))
      ),
      (r) => r.article
    ),
  unfavorite: (slug) =>
    Effect.map(
      handleClientRequest(
        withJwtToken((jwtToken) => client.unfavorite({ path: { slug } }, { jwtToken }))
      ),
      (r) => r.article
    )
})
