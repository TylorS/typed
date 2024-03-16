import { client } from "@/api/client"
import { Articles } from "@/services"
import { handleClientRequest, withJwtToken } from "./_client"

export const ArticlesLive = Articles.implement({
  get: (input) => handleClientRequest(client.getArticle({ params: input }), (r) => r.article),
  create: (input) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.createArticle({ body: { article: input } }, { jwtToken })),
      (r) => r.article
    ),
  update: (slug, input) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.updateArticle({ params: { slug }, body: { article: input } }, { jwtToken })),
      (r) => r.article
    ),
  delete: (input) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.deleteArticle({ params: input }, { jwtToken }))
    ),
  list: (input) => handleClientRequest(client.getArticles({ query: input }), (r) => r.articles),
  feed: (input) => handleClientRequest(client.getFeed({ query: input }), (r) => r.articles),
  favorite: (slug) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.favorite({ params: { slug } }, { jwtToken })),
      (r) => r.article
    ),
  unfavorite: (slug) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.unfavorite({ params: { slug } }, { jwtToken })),
      (r) => r.article
    )
})
