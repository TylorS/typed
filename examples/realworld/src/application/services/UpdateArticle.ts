import * as Schema from "@effect/schema/Schema"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { ArticleSlug, JwtToken } from "../../domain"
import { Article } from "../../domain"

export const UpdateArticleInput = Article.pipe(
  Schema.pick("title", "description", "body", "tagList")
)

export type UpdateArticleInput = Schema.Schema.To<typeof UpdateArticleInput>

export const UpdateArticle = Context.Fn<
  (slug: ArticleSlug, input: UpdateArticleInput, token: JwtToken) => Effect<Article>
>()((_) => class UpdateArticle extends _("articles/UpdateArticle") {})

export type UpdateArticle = Context.Fn.Identifier<typeof UpdateArticle>
