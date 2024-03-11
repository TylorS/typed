import { ArticleSlug } from "@/model"
import * as Route from "@typed/route"
import * as Schema from "lib/Schema"

export const favorites = Route.fromPath("/articles/:slug/favorites").pipe(
  Route.decode(Schema.struct({ slug: ArticleSlug }))
)
