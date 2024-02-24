import * as Schema from "@effect/schema/Schema"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import { type Article } from "../../domain"

export const GetFeedInput = Schema.struct({
  limit: Schema.optional(Schema.number, { exact: true, nullable: true, as: "Option" }),
  offset: Schema.optional(Schema.number, { exact: true, nullable: true, as: "Option" })
})

export type GetFeedInput = Schema.Schema.To<typeof GetFeedInput>

export const GetFeed = Context.Fn<(options: GetFeedInput) => Effect<ReadonlyArray<Article>>>()((_) =>
  class GetFeed extends _("articles/GetFeed") {}
)

export type GetFeed = Context.Fn.Identifier<typeof GetFeed>
