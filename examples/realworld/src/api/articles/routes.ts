import { ArticleSlug } from "@/domain"
import { Schema } from "@effect/schema"
import * as Route from "@typed/route"

export const articles = Route.fromPath("/articles")

export const article = Route.fromPath("/articles/:slug").pipe(
  Route.decode(Schema.struct({ slug: ArticleSlug }))
)

export const feed = Route.fromPath("/articles/feed")
