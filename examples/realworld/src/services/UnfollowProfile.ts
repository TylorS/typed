import type { Profile, Username } from "@realworld/model"
import type { Unauthorized, Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export type UnfollowProfileError = Unauthorized | Unprocessable

export const UnfollowProfile = Fn<(username: Username) => Effect.Effect<Profile, UnfollowProfileError>>()(
  "UnfollowProfile"
)
