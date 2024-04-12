import { client } from "@/api/client"
import { Articles } from "@/services"
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
        withJwtToken((jwtToken) => client.createArticle({ path: {}, body: { article: input } }, jwtToken))
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
    handleClientRequest(
      withJwtToken((jwtToken) => client.deleteArticle({ path: input }, jwtToken))
    ),
  list: (input) =>
    Effect.map(
      handleClientRequest(withOptionalJwtToken((jwtToken) => client.getArticles({  path: {}, query: input }, jwtToken))),
      (r) => r.articles
    ),
  feed: (input) =>
    Effect.map(
      handleClientRequest(withJwtToken((jwtToken) => client.getFeed({ path: {},  query: input }, jwtToken))),
      (r) => r.articles
    ),
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
