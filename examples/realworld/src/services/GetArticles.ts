import type { Article } from "@/domain"
import { ArticleTag, Username } from "@/domain"
import * as Schema from "@/lib/Schema"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const GetArticlesInput = Schema.struct({
  tag: Schema.optionalOrNull(ArticleTag),
  author: Schema.optionalOrNull(Username),
  favorited: Schema.optionalOrNull(Username),
  limit: Schema.optionalOrNull(Schema.number),
  offset: Schema.optionalOrNull(Schema.number)
})

export type GetArticlesInput = Schema.Schema.To<typeof GetArticlesInput>

export const GetArticles = Fn<(input: GetArticlesInput) => Effect.Effect<ReadonlyArray<Article>>>()("GetArticles")
export type GetArticles = Fn.Identifier<typeof GetArticles>
