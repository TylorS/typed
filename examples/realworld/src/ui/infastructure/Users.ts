import { client } from "@/api"
import { Users } from "@/services"
import { handleClientRequest, withJwtToken } from "@/ui/infastructure/_client"

export const UsersLive = Users.implement({
  current: (jwtToken) => handleClientRequest(client.getCurrentUser({}, { jwtToken }), (r) => r.user),
  login: (input) => handleClientRequest(client.login({ body: { user: input } }), (r) => r.user),
  register: (input) => handleClientRequest(client.register({ body: { user: input } }), (r) => r.user),
  update: (input) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.updateUser({ body: { user: input } }, { jwtToken })),
      (r) => r.user
    )
})
