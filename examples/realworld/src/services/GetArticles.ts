import * as Schema from "@/lib/Schema"
import type { Article } from "@/model"
import { ArticleTag, Username } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const GetArticlesInput = Schema.struct({
  tag: Schema.optionalOrNull(ArticleTag),
  author: Schema.optionalOrNull(Username),
  favorited: Schema.optionalOrNull(Username),
  limit: Schema.optionalOrNull(Schema.NumberFromString),
  offset: Schema.optionalOrNull(Schema.NumberFromString)
}).pipe(
  Schema.identifier("GetArticlesInput")
)

export type GetArticlesInput = Schema.Schema.Type<typeof GetArticlesInput>

export type GetArticlesError = Unprocessable | Unauthorized

export const GetArticles = Fn<(input: GetArticlesInput) => Effect.Effect<ReadonlyArray<Article>, GetArticlesError>>()(
  "GetArticles"
)
export type GetArticles = Fn.Identifier<typeof GetArticles>
