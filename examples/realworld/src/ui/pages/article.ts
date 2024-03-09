import { ArticleSlug } from "@/domain"
import { Schema } from "@effect/schema"
import * as Route from "@typed/route"

export const route = Route.fromPath("/article/:slug").pipe(
  Route.decode(Schema.struct({ slug: ArticleSlug }))
)

export type Params = Route.Output<typeof route>
