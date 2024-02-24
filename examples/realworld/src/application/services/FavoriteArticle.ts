import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { Article, ArticleSlug, JwtToken } from "../../domain"

export const FavoriteArticle = Context.Fn<(slug: ArticleSlug, token: JwtToken) => Effect<Article>>()((_) =>
  class FavoriteArticle extends _("articles/FavoriteArticle") {}
)

export type FavoriteArticle = Context.Fn.Identifier<typeof FavoriteArticle>
