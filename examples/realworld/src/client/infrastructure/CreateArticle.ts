import { CreateArticle } from "@/application"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const CreateArticleLive = CreateArticle.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof CreateArticle> = () => Effect.dieMessage("Not implemented")

  return create
}))
