import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { Article, ArticleSlug, JwtToken } from "../../domain"

export const DeleteArticle = Context.Fn<(id: ArticleSlug, token: JwtToken) => Effect<Article>>()((_) =>
  class DeleteArticle extends _("articles/DeleteArticle") {}
)

export type DeleteArticle = Context.Fn.Identifier<typeof DeleteArticle>
