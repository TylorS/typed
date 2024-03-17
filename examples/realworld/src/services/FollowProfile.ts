import type { Profile, Username } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export type FollowProfileError = Unauthorized | Unprocessable

export const FollowProfile = Fn<(username: Username) => Effect.Effect<Profile, FollowProfileError>>()(
  "FollowProfile"
)

export type FollowProfile = Fn.Identifier<typeof FollowProfile>
