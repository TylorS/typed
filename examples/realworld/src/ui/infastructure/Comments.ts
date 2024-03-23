import { client } from "@/api/client"
import { Comments } from "@/services"
import { handleClientRequest, withJwtToken } from "@/ui/infastructure/_client"
import { Effect } from "effect"

export const CommentsLive = Comments.implement({
  get: (slug) =>
    Effect.map(
      handleClientRequest(client.getComments({ path: { slug } })),
      (r) => r.comments
    ),
  create: (slug, input) =>
    Effect.map(
      handleClientRequest(
        withJwtToken((jwtToken) => client.createComment({ path: { slug }, body: { comment: input } }, { jwtToken }))
      ),
      (r) => r.comment
    ),
  delete: (slug, { id }) =>
    handleClientRequest(withJwtToken((jwtToken) => client.deleteComment({ path: { slug, id } }, { jwtToken })))
})
