import type { JwtToken, User } from "@/model/User"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { InvalidTokenError } from "./errors"

export const GetCurrentUser = Context.Fn<(token: JwtToken) => Effect<User, InvalidTokenError>>()((_) =>
  class GetCurrentUser extends _("auth/GetCurrentUser") {}
)

export type GetCurrentUser = Context.Fn.Identifier<typeof GetCurrentUser>
