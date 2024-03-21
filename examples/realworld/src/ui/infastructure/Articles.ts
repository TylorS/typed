import { client } from "@/api/client"
import { Articles } from "@/services"
import { handleClientRequest, withJwtToken } from "./_client"

export const ArticlesLive = Articles.implement({
  get: (input) => {
    return handleClientRequest(client.getArticle({ path: input }), (r) => r.article)
  },
  create: (input) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.createArticle({ body: { article: input } }, { jwtToken })),
      (r) => r.article
    ),
  update: (slug, input) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.updateArticle({ path: { slug }, body: { article: input } }, { jwtToken })),
      (r) => r.article
    ),
  delete: (input) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.deleteArticle({ path: input }, { jwtToken }))
    ),
  list: (input) => handleClientRequest(client.getArticles({ query: input }), (r) => r.articles),
  feed: (input) =>
    handleClientRequest(withJwtToken((jwtToken) => client.getFeed({ query: input }, { jwtToken })), (r) => r.articles),
  favorite: (slug) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.favorite({ path: { slug } }, { jwtToken })),
      (r) => r.article
    ),
  unfavorite: (slug) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.unfavorite({ path: { slug } }, { jwtToken })),
      (r) => r.article
    )
})
