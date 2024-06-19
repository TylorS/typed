import { Fn } from "@typed/context"
import * as Schema from "@typed/realworld/lib/Schema"
import type { Article } from "@typed/realworld/model"
import { ArticleSlug } from "@typed/realworld/model"
import type { Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export const GetArticleInput = Schema.Struct({ slug: ArticleSlug }).pipe(
  Schema.annotations({ identifier: "GetArticleInput" })
)
export type GetArticleInput = Schema.Schema.Type<typeof GetArticleInput>

export const GetArticle = Fn<(input: GetArticleInput) => Effect.Effect<Article, Unprocessable>>()("GetArticle")
export type GetArticle = Fn.Identifier<typeof GetArticle>
