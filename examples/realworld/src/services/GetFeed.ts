import type { Article } from "@/domain"
import * as Schema from "@/lib/Schema"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const GetFeedInput = Schema.struct({
  limit: Schema.optionalOrNull(Schema.number),
  offset: Schema.optionalOrNull(Schema.number)
})
export type GetFeedInput = Schema.Schema.To<typeof GetFeedInput>

export const GetFeed = Fn<(input: GetFeedInput) => Effect.Effect<ReadonlyArray<Article>>>()("GetFeed")
export type GetFeed = Fn.Identifier<typeof GetFeed>
