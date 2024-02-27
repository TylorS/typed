import type { JwtToken, Username } from "@/domain"
import type { Profile } from "@/domain/Profile"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"

export const UnfollowUser = Context.Fn<(username: Username, token: JwtToken) => Effect<Profile>>()((_) =>
  class UnfollowUser extends _("profile/UnfollowUser") {}
)

export type UnfollowUser = Context.Fn.Identifier<typeof UnfollowUser>
