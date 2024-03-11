import type { Article } from "@/domain"
import { ArticleSlug } from "@/domain"
import * as Schema from "@/lib/Schema"
import type { Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const GetArticleInput = Schema.struct({ slug: ArticleSlug })
export type GetArticleInput = Schema.Schema.To<typeof GetArticleInput>

export const GetArticle = Fn<(input: GetArticleInput) => Effect.Effect<Article, Unprocessable>>()("GetArticle")
export type GetArticle = Fn.Identifier<typeof GetArticle>
