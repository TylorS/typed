import type { Profile, Username } from "@realworld/model"
import type { Unauthorized, Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export type GetProfileError = Unauthorized | Unprocessable

export const GetProfile = Fn<(username: Username) => Effect.Effect<Profile, GetProfileError>>()(
  "GetProfile"
)

export type GetProfile = Fn.Identifier<typeof GetProfile>
