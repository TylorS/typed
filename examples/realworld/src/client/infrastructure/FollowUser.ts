import { FollowUser } from "@/services"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const FollowUserLive = FollowUser.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof FollowUser> = () => Effect.dieMessage("Not implemented")

  return create
}))
