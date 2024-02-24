import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { JwtToken, Username } from "../../domain"
import type { Profile } from "../../domain/Profile"

export const FollowUser = Context.Fn<(username: Username, token: JwtToken) => Effect<Profile>>()((_) =>
  class FollowUser extends _("profile/FollowUser") {}
)

export type FollowUser = Context.Fn.Identifier<typeof FollowUser>
