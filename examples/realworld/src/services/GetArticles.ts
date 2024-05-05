import { Fn } from "@typed/context"
import * as Schema from "@typed/realworld/lib/Schema"
import type { Article } from "@typed/realworld/model"
import { ArticleTag, Username } from "@typed/realworld/model"
import type { Unprocessable } from "@typed/realworld/services/errors"
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

export type GetArticlesInput = Schema.Schema.Type<typeof GetArticlesInput>

export const defaultGetArticlesInput: GetArticlesInput = {
  tag: Option.none(),
  author: Option.none(),
  favorited: Option.none(),
  limit: Option.none(),
  offset: Option.none()
}

export type GetArticlesError = Unprocessable

export const GetArticles = Fn<
  (
    input: GetArticlesInput
  ) => Effect.Effect<
    {
      readonly articles: ReadonlyArray<Article>
      readonly articlesCount: number
    },
    GetArticlesError
  >
>()(
  "GetArticles"
)
export type GetArticles = Fn.Identifier<typeof GetArticles>
