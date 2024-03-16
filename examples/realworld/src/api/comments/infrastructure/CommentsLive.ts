import { Comments } from "@/services"
import * as Pg from "@sqlfx/pg"
import { Effect } from "effect"

export const CommentsLive = Comments.implement({
  get: () =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  create: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  delete: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    })
})
