import { DeleteArticle } from "@/services"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const DeleteArticleLive = DeleteArticle.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof DeleteArticle> = () => Effect.dieMessage("Not implemented")

  return create
}))
