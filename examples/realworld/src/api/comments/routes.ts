import { ArticleSlug, CommentId } from "@/model"
import { Schema } from "@effect/schema"
import * as Route from "@typed/route"

export const comments = Route.literal("/articles/:slug/comments").pipe(
  Route.withSchema(Schema.struct({ slug: ArticleSlug }))
)

export const comment = Route.literal("/articles/:slug/comments/:id").pipe(
  Route.withSchema(Schema.struct({ slug: ArticleSlug, id: CommentId }))
)
