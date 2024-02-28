import { GetArticles } from "@/services"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const GetArticlesLive = GetArticles.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof GetArticles> = () => Effect.dieMessage("Not implemented")

  return create
}))
