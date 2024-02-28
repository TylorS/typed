import { GetComments } from "@/services"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const GetCommentsLive = GetComments.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof GetComments> = () => Effect.dieMessage("Not implemented")

  return create
}))
