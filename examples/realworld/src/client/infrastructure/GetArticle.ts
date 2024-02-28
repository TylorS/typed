import { GetArticle } from "@/services"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const GetArticleLive = GetArticle.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof GetArticle> = () => Effect.dieMessage("Not implemented")

  return create
}))
