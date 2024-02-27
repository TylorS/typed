import { GetTags } from "@/application"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const GetTagsLive = GetTags.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof GetTags> = () => Effect.dieMessage("Not implemented")

  return create
}))
