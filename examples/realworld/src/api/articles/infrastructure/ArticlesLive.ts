import { Articles } from "@/services"
import * as Pg from "@sqlfx/pg"
import { Effect } from "effect"

export const ArticlesLive = Articles.implement({
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
  update: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  delete: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  favorite: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  unfavorite: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  list: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  feed: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    })
})
