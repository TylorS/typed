import { Profiles } from "@/services"
import { Effect } from "effect"

export const ProfilesLive = Profiles.implement({
  get: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  follow: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  unfollow: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    })
})
