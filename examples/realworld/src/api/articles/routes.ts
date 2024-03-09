import { ArticleSlug } from "@/domain"
import * as Schema from "@/lib/Schema"
import * as Route from "@typed/route"

export const articles = Route.fromPath("/articles")

export const article = Route.fromPath("/articles/:slug").pipe(
  // Decode should return a special RouteGuard instance which has access to the Schema
  Route.decode(Schema.struct({ slug: ArticleSlug }))
)

export const feed = Route.fromPath("/articles/feed")
