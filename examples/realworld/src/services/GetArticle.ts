import * as Schema from "@realworld/lib/Schema"
import type { Article } from "@realworld/model"
import { ArticleSlug } from "@realworld/model"
import type { Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const GetArticleInput = Schema.Struct({ slug: ArticleSlug }).pipe(Schema.identifier("GetArticleInput"))
export type GetArticleInput = Schema.Schema.Type<typeof GetArticleInput>

export const GetArticle = Fn<(input: GetArticleInput) => Effect.Effect<Article, Unprocessable>>()("GetArticle")
export type GetArticle = Fn.Identifier<typeof GetArticle>
