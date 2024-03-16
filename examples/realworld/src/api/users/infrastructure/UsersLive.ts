import { Users } from "@/services"
import * as Pg from "@sqlfx/pg"
import { Effect } from "effect"

export const UsersLive = Users.implement({
  current: () =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  register: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  login: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  update: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    })
})
