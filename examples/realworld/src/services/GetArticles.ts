import { type Article, ArticleTag, Username } from "@/model"
import * as Schema from "@effect/schema/Schema"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"

export const GetArticlesInput = Schema.struct({
  tag: Schema.optional(ArticleTag, { exact: true, nullable: true, as: "Option" }),
  author: Schema.optional(Username, { exact: true, nullable: true, as: "Option" }),
  favorited: Schema.optional(Username, { exact: true, nullable: true, as: "Option" }),
  limit: Schema.optional(Schema.number, { exact: true, nullable: true, as: "Option" }),
  offset: Schema.optional(Schema.number, { exact: true, nullable: true, as: "Option" })
})

export type GetArticlesInput = Schema.Schema.To<typeof GetArticlesInput>

export const GetArticles = Context.Fn<(options: GetArticlesInput) => Effect<ReadonlyArray<Article>>>()((_) =>
  class GetArticles extends _("articles/GetArticles") {}
)

export type GetArticles = Context.Fn.Identifier<typeof GetArticles>
