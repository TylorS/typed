import { Tags } from "@/services"
import * as Pg from "@sqlfx/pg"
import { Effect } from "effect"

export const TagsLive = Tags.implement({
  get: () =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    })
})
