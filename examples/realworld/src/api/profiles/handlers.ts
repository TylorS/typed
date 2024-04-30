import { catchUnauthorizedAndUnprocessable, catchUnprocessable } from "@/api/common/handlers"
import { Profiles } from "@/services"
import { ServerRouterBuilder } from "@typed/server"
import { Effect, flow } from "effect"
import * as Spec from "./spec.js"

export const handleGetProfile = Spec.getProfile.pipe(
  ServerRouterBuilder.fromEndpoint(
    ({ path: { username } }) => Profiles.get(username).pipe(Effect.bindTo("profile"), catchUnprocessable)
  )
)

export const handleFollowProfile = Spec.follow.pipe(
  ServerRouterBuilder.fromEndpoint(
    ({ path: { username } }) =>
      Profiles.follow(username).pipe(Effect.bindTo("profile"), catchUnauthorizedAndUnprocessable)
  )
)

export const handleUnfollowProfile = Spec.unfollow.pipe(
  ServerRouterBuilder.fromEndpoint(
    ({ path: { username } }) =>
      Profiles.unfollow(username).pipe(Effect.bindTo("profile"), catchUnauthorizedAndUnprocessable)
  )
)

export const handleProfiles = flow(
  handleGetProfile,
  handleFollowProfile,
  handleUnfollowProfile
)
