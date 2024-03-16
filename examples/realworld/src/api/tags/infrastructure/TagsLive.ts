import { Tags } from "@/services"
import { Effect } from "effect"

export const TagsLive = Tags.implement({
  get: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    })
})
