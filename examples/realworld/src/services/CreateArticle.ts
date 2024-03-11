import { Article } from "@/domain"
import * as Schema from "@/lib/Schema"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const CreateArticleInput = Article.pipe(
  Schema.omit("slug", "createdAt", "updatedAt", "favorited", "favoritesCount")
)
export type CreateArticleInput = Schema.Schema.To<typeof CreateArticleInput>

export const CreateArticle = Fn<(input: CreateArticleInput) => Effect.Effect<Article>>()("CreateArticle")
export type CreateArticle = Fn.Identifier<typeof CreateArticle>
