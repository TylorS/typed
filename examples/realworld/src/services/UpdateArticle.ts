import type { Article, ArticleSlug } from "@/model"
import { CreateArticleInput } from "@/services/CreateArticle"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"
import * as Schema from "lib/Schema"

export const UpdateArticleInput = Schema.partial(CreateArticleInput)
export type UpdateArticleInput = Schema.Schema.To<typeof UpdateArticleInput>

export type UpdateArticleError = Unauthorized | Unprocessable

export const UpdateArticle = Fn<
  (slug: ArticleSlug, input: UpdateArticleInput) => Effect.Effect<Article, UpdateArticleError>
>()(
  "UpdateArticle"
)
export type UpdateArticle = Fn.Identifier<typeof UpdateArticle>
