import { client } from "@/api/client"
import { Comments } from "@/services"
import { handleClientRequest, withJwtToken } from "@/ui/infastructure/_client"

export const CommentsLive = Comments.implement({
  get: (slug) => handleClientRequest(client.getComments({ path: { slug } }), (r) => r.comments),
  create: (slug, input) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.createComment({ path: { slug }, body: { comment: input } }, { jwtToken })),
      (r) => r.comment
    ),
  delete: (slug, { id }) =>
    handleClientRequest(withJwtToken((jwtToken) => client.deleteComment({ path: { slug, id } }, { jwtToken })))
})
