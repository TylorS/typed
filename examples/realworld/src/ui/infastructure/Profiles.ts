import { client } from "@/api/client"
import { Profiles } from "@/services"
import { handleClientRequest, withJwtToken } from "@/ui/infastructure/_client"

export const ProfilesLive = Profiles.implement({
  get: (username) =>
    handleClientRequest(
      client.getProfile({ params: { username } }),
      (r) => r.profile
    ),
  follow: (username) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.follow({ params: { username } }, { jwtToken })),
      (r) => r.profile
    ),
  unfollow: (username) =>
    handleClientRequest(
      withJwtToken((jwtToken) => client.unfollow({ params: { username } }, { jwtToken })),
      (r) => r.profile
    )
})
