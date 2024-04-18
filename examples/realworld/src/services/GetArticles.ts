import * as Schema from "@/lib/Schema"
import type { Article } from "@/model"
import { ArticleTag, Username } from "@/model"
import type { Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import { type Effect, Option } from "effect"

export const GetArticlesInput = Schema.Struct({
  tag: Schema.optionalOrNull(ArticleTag),
  author: Schema.optionalOrNull(Username),
  favorited: Schema.optionalOrNull(Username),
  limit: Schema.optionalOrNull(Schema.NumberFromString),
  offset: Schema.optionalOrNull(Schema.NumberFromString)
}).pipe(
  Schema.identifier("GetArticlesInput")
)

export const defaultGetArticlesInput: GetArticlesInput = {
  tag: Option.none(),
  author: Option.none(),
  favorited: Option.none(),
  limit: Option.none(),
  offset: Option.none()
}

export type GetArticlesInput = Schema.Schema.Type<typeof GetArticlesInput>

export type GetArticlesError = Unprocessable

export const GetArticles = Fn<(input: GetArticlesInput) => Effect.Effect<ReadonlyArray<Article>, GetArticlesError>>()(
  "GetArticles"
)
export type GetArticles = Fn.Identifier<typeof GetArticles>
