import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { Article, ArticleSlug } from "../../domain"

export const GetArticle = Context.Fn<(slug: ArticleSlug) => Effect<Article>>()((_) =>
  class GetArticle extends _("articles/GetArticle") {}
)

export type GetArticle = Context.Fn.Identifier<typeof GetArticle>
