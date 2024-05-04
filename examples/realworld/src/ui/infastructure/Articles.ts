import { client } from "@realworld/api/client"
import { Articles } from "@realworld/services"
import { Effect } from "effect"
import { handleClientRequest, withJwtToken, withOptionalJwtToken } from "./_client"

export const ArticlesLive = Articles.implement({
  get: (input) =>
    withOptionalJwtToken((jwtToken) =>
      Effect.map(handleClientRequest(client.getArticle({ path: input }, jwtToken)), (r) => r.article)
    ),
  create: (input) =>
    Effect.map(
      handleClientRequest(
        withJwtToken((jwtToken) => client.createArticle({ body: { article: input } }, jwtToken))
      ),
      (r) => r.article
    ),
  update: (slug, input) =>
    Effect.map(
      handleClientRequest(
        withJwtToken((jwtToken) => client.updateArticle({ path: { slug }, body: { article: input } }, jwtToken))
      ),
      (r) => r.article
    ),
  delete: (input) =>
    Effect.map(
      handleClientRequest(
        withJwtToken((jwtToken) => client.deleteArticle({ path: input }, jwtToken))
      ),
      (r) => r.article
    ),
  list: (input) =>
    handleClientRequest(withOptionalJwtToken((jwtToken) => client.getArticles({ query: input }, jwtToken))),
  feed: (input) => handleClientRequest(withJwtToken((jwtToken) => client.getFeed({ query: input }, jwtToken))),
  favorite: (slug) =>
    Effect.map(
      handleClientRequest(
        withJwtToken((jwtToken) => client.favorite({ path: { slug } }, jwtToken))
      ),
      (r) => r.article
    ),
  unfavorite: (slug) =>
    Effect.map(
      handleClientRequest(
        withJwtToken((jwtToken) => client.unfavorite({ path: { slug } }, jwtToken))
      ),
      (r) => r.article
    )
})
