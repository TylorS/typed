import { ArticleSlug } from "@/domain"
import * as Schema from "@/lib/Schema"
import * as Route from "@typed/route"

export const favorites = Route.fromPath("/articles/:slug/favorites").pipe(
  Route.decode(Schema.struct({ slug: ArticleSlug }))
)
