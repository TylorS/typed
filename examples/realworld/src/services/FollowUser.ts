import type { JwtToken, Username } from "@/model"
import type { Profile } from "@/model/Profile"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"

export const FollowUser = Context.Fn<(username: Username, token: JwtToken) => Effect<Profile>>()((_) =>
  class FollowUser extends _("profile/FollowUser") {}
)

export type FollowUser = Context.Fn.Identifier<typeof FollowUser>
