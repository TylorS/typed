import { Fn } from "@typed/context"
import type { Profile, Username } from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export type UnfollowProfileError = Unauthorized | Unprocessable

export const UnfollowProfile = Fn<(username: Username) => Effect.Effect<Profile, UnfollowProfileError>>()(
  "UnfollowProfile"
)
