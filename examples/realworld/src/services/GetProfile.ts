import type { Profile, Username } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export type GetProfileError = Unauthorized | Unprocessable

export const GetProfile = Fn<(username: Username) => Effect.Effect<Profile, GetProfileError>>()(
  "GetProfile"
)
