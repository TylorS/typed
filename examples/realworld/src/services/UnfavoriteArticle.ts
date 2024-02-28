import type { Article, ArticleSlug, JwtToken } from "@/model"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"

export const UnfavoriteArticle = Context.Fn<(slug: ArticleSlug, token: JwtToken) => Effect<Article>>()((_) =>
  class UnfavoriteArticle extends _("articles UnfavoriteArticle") {}
)

export type UnfavoriteArticle = Context.Fn.Identifier<typeof UnfavoriteArticle>
