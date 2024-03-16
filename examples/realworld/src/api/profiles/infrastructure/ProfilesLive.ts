import { Profiles } from "@/services"
import * as Pg from "@sqlfx/pg"
import { Effect } from "effect"

export const ProfilesLive = Profiles.implement({
  get: () =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  follow: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  unfollow: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)

      return yield* _(Effect.dieMessage(`Not implemented`))
    })
})
