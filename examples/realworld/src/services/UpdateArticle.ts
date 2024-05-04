import * as Schema from "@realworld/lib/Schema"
import type { Article, ArticleSlug } from "@realworld/model"
import { CreateArticleInput } from "@realworld/services/CreateArticle"
import type { Unauthorized, Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const UpdateArticleInput = Schema.partial(CreateArticleInput).pipe(
  Schema.identifier("UpdateArticleInput")
)
export type UpdateArticleInput = Schema.Schema.Type<typeof UpdateArticleInput>

export type UpdateArticleError = Unauthorized | Unprocessable

export const UpdateArticle = Fn<
  (slug: ArticleSlug, input: UpdateArticleInput) => Effect.Effect<Article, UpdateArticleError>
>()(
  "UpdateArticle"
)
export type UpdateArticle = Fn.Identifier<typeof UpdateArticle>
