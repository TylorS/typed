import { client } from "@/api/client"
import { Comments } from "@/services"
import { handleClientRequest, withJwtToken } from "@/ui/infastructure/_client"

export const CommentsLive = Comments.implement({
  get: (slug) => handleClientRequest(client.getComments({ params: { slug } }), (r) => r.comments),
  create: (slug, input) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.createComment({ params: { slug }, body: { comment: input } }, { jwtToken })),
      (r) => r.comment
    ),
  delete: (slug, { id }) =>
    handleClientRequest(withJwtToken((jwtToken) => client.deleteComment({ params: { slug, id } }, { jwtToken })))
})
