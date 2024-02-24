import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { Username } from "../../domain"
import type { Profile } from "../../domain/Profile"

export const GetProfile = Context.Fn<(username: Username) => Effect<Profile>>()((_) =>
  class GetProfile extends _("profile/GetProfile") {}
)

export type GetProfile = Context.Fn.Identifier<typeof GetProfile>
