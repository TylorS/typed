import type { User, Username } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export type GetCurrentUserError = Unauthorized | Unprocessable

export const GetCurrentUser = Fn<(username: Username) => Effect.Effect<User, GetCurrentUserError>>()(
  "GetProfile"
)
