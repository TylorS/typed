import { UpdateArticle } from "@/application"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const UpdateArticleLive = UpdateArticle.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof UpdateArticle> = () => Effect.dieMessage("Not implemented")

  return create
}))
