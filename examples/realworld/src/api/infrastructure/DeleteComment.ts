import { DeleteComment } from "@/services"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const DeleteCommentLive = DeleteComment.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof DeleteComment> = () => Effect.dieMessage("Not implemented")

  return create
}))
