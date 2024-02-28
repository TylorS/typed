import { GetFeed } from "@/services"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const GetFeedLive = GetFeed.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof GetFeed> = () => Effect.dieMessage("Not implemented")

  return create
}))
