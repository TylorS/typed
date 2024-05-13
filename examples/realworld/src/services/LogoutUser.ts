import { Fn } from "@typed/context"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export type LogoutUserError = Unauthorized | Unprocessable

export const LogoutUser = Fn<() => Effect.Effect<void, LogoutUserError>>()("LogoutUser")
export type LogoutUser = Fn.Identifier<typeof LogoutUser>
