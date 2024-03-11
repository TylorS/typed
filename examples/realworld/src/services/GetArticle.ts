import type { Article } from "@/model"
import { ArticleSlug } from "@/model"
import type { Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"
import * as Schema from "lib/Schema"

export const GetArticleInput = Schema.struct({ slug: ArticleSlug })
export type GetArticleInput = Schema.Schema.To<typeof GetArticleInput>

export const GetArticle = Fn<(input: GetArticleInput) => Effect.Effect<Article, Unprocessable>>()("GetArticle")
export type GetArticle = Fn.Identifier<typeof GetArticle>
