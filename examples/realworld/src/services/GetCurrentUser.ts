import type { User } from "@realworld/model"
import type { Unauthorized, Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export type GetCurrentUserError = Unauthorized | Unprocessable

export const GetCurrentUser = Fn<() => Effect.Effect<User, GetCurrentUserError>>()("GetCurrentUser")
export type GetCurrentUser = Fn.Identifier<typeof GetCurrentUser>
