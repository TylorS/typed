import { client } from "@/api/client"
import { Profiles } from "@/services"
import { handleClientRequest, withJwtToken, withOptionalJwtToken } from "@/ui/infastructure/_client"
import { Effect } from "effect"

export const ProfilesLive = Profiles.implement({
  get: (username) =>
    Effect.map(
      handleClientRequest(
        withOptionalJwtToken((jwtToken) => client.getProfile({ path: { username } }, jwtToken))
      ),
      (r) => r.profile
    ),
  follow: (username) =>
    Effect.map(
      handleClientRequest(
        withJwtToken((jwtToken) => client.follow({ path: { username } }, jwtToken))
      ),
      (r) => r.profile
    ),
  unfollow: (username) =>
    Effect.map(
      handleClientRequest(
        withJwtToken((jwtToken) => client.unfollow({ path: { username } }, jwtToken))
      ),
      (r) => r.profile
    )
})
