import { UnfollowUser } from "@/application"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const UnfollowUserLive = UnfollowUser.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof UnfollowUser> = () => Effect.dieMessage("Not implemented")

  return create
}))
