import { Fn } from "@typed/context"
import type { Article, ArticleSlug } from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export type FavoriteArticleError = Unauthorized | Unprocessable

export const FavoriteArticle = Fn<(slug: ArticleSlug) => Effect.Effect<Article, FavoriteArticleError>>()(
  "FavoriteArticle"
)

export type FavoriteArticle = Fn.Identifier<typeof FavoriteArticle>
