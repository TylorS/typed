import { GetProfile } from "@/application"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const GetProfileLive = GetProfile.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof GetProfile> = () => Effect.dieMessage("Not implemented")

  return create
}))
