import { Fn } from "@typed/context"
import * as Schema from "@typed/realworld/lib/Schema"
import type { Article, ArticleSlug } from "@typed/realworld/model"
import { CreateArticleInput } from "@typed/realworld/services/CreateArticle"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export const UpdateArticleInput = Schema.partial(CreateArticleInput).annotations({ identifier: "UpdateArticleInput" })
export type UpdateArticleInput = Schema.Schema.Type<typeof UpdateArticleInput>

export type UpdateArticleError = Unauthorized | Unprocessable

export const UpdateArticle = Fn<
  (slug: ArticleSlug, input: UpdateArticleInput) => Effect.Effect<Article, UpdateArticleError>
>()(
  "UpdateArticle"
)
export type UpdateArticle = Fn.Identifier<typeof UpdateArticle>
