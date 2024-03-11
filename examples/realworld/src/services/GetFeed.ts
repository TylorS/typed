import type { Article } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"
import * as Schema from "lib/Schema"

export const GetFeedInput = Schema.struct({
  limit: Schema.optionalOrNull(Schema.number),
  offset: Schema.optionalOrNull(Schema.number)
})
export type GetFeedInput = Schema.Schema.To<typeof GetFeedInput>

export type GetFeedError = Unprocessable | Unauthorized

export const GetFeed = Fn<(input: GetFeedInput) => Effect.Effect<ReadonlyArray<Article>, GetFeedError>>()("GetFeed")
export type GetFeed = Fn.Identifier<typeof GetFeed>
