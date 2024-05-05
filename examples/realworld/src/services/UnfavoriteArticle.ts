import { Fn } from "@typed/context"
import type { Article, ArticleSlug } from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export type UnfavoriteArticleError = Unauthorized | Unprocessable

export const UnfavoriteArticle = Fn<(slug: ArticleSlug) => Effect.Effect<Article, UnfavoriteArticleError>>()(
  "UnfavoriteArticle"
)
