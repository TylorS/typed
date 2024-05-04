import type { Article, ArticleSlug } from "@realworld/model"
import type { Unauthorized, Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export type UnfavoriteArticleError = Unauthorized | Unprocessable

export const UnfavoriteArticle = Fn<(slug: ArticleSlug) => Effect.Effect<Article, UnfavoriteArticleError>>()(
  "UnfavoriteArticle"
)
