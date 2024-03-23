import { ArticleSlug } from "@/model"
import { isAuthenticatedGuard } from "@/services"
import { Schema } from "@effect/schema"
import * as Route from "@typed/route"

export const route = Route.fromPath("/editor/:slug").pipe(
  Route.guard(isAuthenticatedGuard),
  Route.decode(Schema.struct({ slug: ArticleSlug }))
)

export type Params = Route.Output<typeof route>
