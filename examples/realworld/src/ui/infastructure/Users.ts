import { client } from "@/api/client"
import { SaveJwtToken, Users } from "@/services"
import { handleClientRequest, withJwtToken } from "@/ui/infastructure/_client"
import { Effect } from "effect"

export const UsersLive = Users.implement({
  current: () =>
    withJwtToken((jwtToken) => client.getCurrentUser({}, { jwtToken })).pipe(
      handleClientRequest,
      Effect.map((r) => r.user),
      Effect.tap((user) => SaveJwtToken(user.token))
    ),

  login: (input) =>
    handleClientRequest(client.login({ body: { user: input } })).pipe(
      Effect.map((r) => r.user),
      Effect.tap((user) => SaveJwtToken(user.token))
    ),
  register: (input) =>
    handleClientRequest(client.register({ body: { user: input } })).pipe(
      Effect.map((r) => r.user),
      Effect.tap((user) => SaveJwtToken(user.token))
    ),
  update: (input) =>
    withJwtToken((jwtToken) => client.updateUser({ body: { user: input } }, { jwtToken })).pipe(
      handleClientRequest,
      Effect.map((r) => r.user),
      Effect.tap((user) => SaveJwtToken(user.token))
    )
})
