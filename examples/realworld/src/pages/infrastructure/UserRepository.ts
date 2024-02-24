import { Effect } from "effect"
import { RealworldApiClient } from "../../api/client"
import { UserRepository } from "../../application"

// TODO: Better handle errors

export const UserRepositoryLayer = UserRepository.implement({
  register: (input) => Effect.orDie(Effect.map(RealworldApiClient.register({ body: { user: input } }), (r) => r.user)),
  current: (token) =>
    Effect.orDie(Effect.map(RealworldApiClient.getCurrentUser({}, { jwtTokenAuth: token }), (r) => r.user)),
  login: (input) => Effect.orDie(Effect.map(RealworldApiClient.login({ body: { user: input } }), (r) => r.user)),
  update: (input, token) =>
    Effect.orDie(
      Effect.map(
        RealworldApiClient.updateCurrentUser({ body: { user: input } }, { jwtTokenAuth: token }),
        (r) => r.user
      )
    )
})
