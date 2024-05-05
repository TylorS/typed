import { Fn } from "@typed/context"
import type { User } from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export type GetCurrentUserError = Unauthorized | Unprocessable

export const GetCurrentUser = Fn<() => Effect.Effect<User, GetCurrentUserError>>()("GetCurrentUser")
export type GetCurrentUser = Fn.Identifier<typeof GetCurrentUser>
