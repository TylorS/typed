import { Articles } from "@/services"
import { Effect } from "effect"

export const ArticlesLive = Articles.implement({
  get: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  create: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  update: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  delete: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  favorite: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  unfavorite: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  list: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  feed: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    })
})
