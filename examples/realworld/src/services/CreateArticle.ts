import { Fn } from "@typed/context"
import * as Schema from "@typed/realworld/lib/Schema"
import { Article } from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export const CreateArticleInput = Article.pipe(
  Schema.pick("title", "description", "body", "tagList"),
  Schema.identifier("CreateArticleInput")
)
export type CreateArticleInput = Schema.Schema.Type<typeof CreateArticleInput>

export type CreateArticleError = Unauthorized | Unprocessable

export const CreateArticle = Fn<(input: CreateArticleInput) => Effect.Effect<Article, CreateArticleError>>()(
  "CreateArticle"
)
export type CreateArticle = Fn.Identifier<typeof CreateArticle>
