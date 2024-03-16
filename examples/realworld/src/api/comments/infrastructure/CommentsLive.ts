import { Comments } from "@/services"
import { Effect } from "effect"

export const CommentsLive = Comments.implement({
  get: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  create: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  delete: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    })
})
