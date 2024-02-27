import type { JwtToken } from "@/domain"
import { Article } from "@/domain"
import * as Schema from "@effect/schema/Schema"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { InvalidTokenError } from "./errors"

export const CreateArticleInput = Article.pipe(
  Schema.pick("title", "description", "body", "tagList")
)

export type CreateArticleInput = Schema.Schema.To<typeof CreateArticleInput>

export type CreateArticleError = InvalidTokenError

export const CreateArticle = Context.Fn<
  (options: CreateArticleInput, token: JwtToken) => Effect<Article, CreateArticleError>
>()((_) => class CreateArticle extends _("articles/CreateArticle") {})

export type CreateArticle = Context.Fn.Identifier<typeof CreateArticle>
