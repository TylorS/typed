import { client } from "@typed/realworld/api/client"
import { RemoveJwtToken, SaveJwtToken, Users } from "@typed/realworld/services"
import { handleClientRequest, withJwtToken } from "@typed/realworld/ui/infastructure/_client"
import { Effect } from "effect"

export const UsersLive = Users.implement({
  current: () =>
    withJwtToken((jwtToken) => client.getCurrentUser({}, jwtToken)).pipe(
      handleClientRequest,
      Effect.map((r) => r.body.user),
      Effect.tap((user) => SaveJwtToken(user.token))
    ),
  login: (input) =>
    handleClientRequest(client.login({ body: { user: input } })).pipe(
      Effect.map((r) => r.body.user),
      Effect.tap((user) => SaveJwtToken(user.token))
    ),
  logout: () =>
    withJwtToken((jwtToken) => client.logout({}, jwtToken)).pipe(
      handleClientRequest,
      Effect.tap(() => RemoveJwtToken())
    ),
  register: (input) =>
    handleClientRequest(client.register({ body: { user: input } })).pipe(
      Effect.map((r) => r.body.user),
      Effect.tap((user) => SaveJwtToken(user.token))
    ),
  update: (input) =>
    withJwtToken((jwtToken) => client.updateUser({ body: { user: input } }, jwtToken)).pipe(
      handleClientRequest,
      Effect.map((r) => r.user),
      Effect.tap((user) => SaveJwtToken(user.token))
    )
})
