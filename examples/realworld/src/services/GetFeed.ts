import * as Schema from "@/lib/Schema"
import type { Article } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const GetFeedInput = Schema.Struct({
  limit: Schema.optional(Schema.NumberFromString, { exact: true, as: "Option" }),
  offset: Schema.optional(Schema.NumberFromString, { exact: true, as: "Option" })
}).pipe(
  Schema.identifier("GetFeedInput")
)
export type GetFeedInput = Schema.Schema.Type<typeof GetFeedInput>

export type GetFeedError = Unprocessable | Unauthorized

export const GetFeed = Fn<
  (input: GetFeedInput) => Effect.Effect<{
    readonly articles: ReadonlyArray<Article>
    readonly articlesCount: number
  }, GetFeedError>
>()("GetFeed")
export type GetFeed = Fn.Identifier<typeof GetFeed>
