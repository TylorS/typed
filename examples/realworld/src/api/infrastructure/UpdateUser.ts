import { UpdateUser } from "@/application"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const UpdateUserLive = UpdateUser.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof UpdateUser> = () => Effect.dieMessage("Not implemented")

  return create
}))
