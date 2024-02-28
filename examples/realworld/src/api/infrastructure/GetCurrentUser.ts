import { GetCurrentUser } from "@/services"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const GetCurrentUserLive = GetCurrentUser.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof GetCurrentUser> = () => Effect.dieMessage("Not implemented")

  return create
}))
