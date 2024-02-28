import type { JwtToken, User } from "@/model/User"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"

export const GetCurrentUser = Context.Fn<(token: JwtToken) => Effect<User>>()((_) =>
  class GetCurrentUser extends _("auth/GetCurrentUser") {}
)

export type GetCurrentUser = Context.Fn.Identifier<typeof GetCurrentUser>
