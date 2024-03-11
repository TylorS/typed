import { Article } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"
import * as Schema from "lib/Schema"

export const CreateArticleInput = Article.pipe(
  Schema.omit("slug", "createdAt", "updatedAt", "favorited", "favoritesCount")
)
export type CreateArticleInput = Schema.Schema.To<typeof CreateArticleInput>

export type CreateArticleError = Unauthorized | Unprocessable

export const CreateArticle = Fn<(input: CreateArticleInput) => Effect.Effect<Article, CreateArticleError>>()(
  "CreateArticle"
)
export type CreateArticle = Fn.Identifier<typeof CreateArticle>
