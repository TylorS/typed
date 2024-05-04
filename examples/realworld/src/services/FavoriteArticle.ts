import type { Article, ArticleSlug } from "@realworld/model"
import type { Unauthorized, Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export type FavoriteArticleError = Unauthorized | Unprocessable

export const FavoriteArticle = Fn<(slug: ArticleSlug) => Effect.Effect<Article, FavoriteArticleError>>()(
  "FavoriteArticle"
)

export type FavoriteArticle = Fn.Identifier<typeof FavoriteArticle>
