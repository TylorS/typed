import { Fn } from "@typed/context"
import type { Profile, Username } from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export type FollowProfileError = Unauthorized | Unprocessable

export const FollowProfile = Fn<(username: Username) => Effect.Effect<Profile, FollowProfileError>>()(
  "FollowProfile"
)

export type FollowProfile = Fn.Identifier<typeof FollowProfile>
