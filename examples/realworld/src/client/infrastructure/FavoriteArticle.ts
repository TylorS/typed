import { FavoriteArticle } from "@/application"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const FavoriteArticleLive = FavoriteArticle.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof FavoriteArticle> = () => Effect.dieMessage("Not implemented")

  return create
}))
