import { ArticleSlug, CommentId } from "@/domain"
import { Schema } from "@effect/schema"
import * as Route from "@typed/route"

export const comments = Route.fromPath("/articles/:slug/comments").pipe(
  Route.decode(Schema.struct({ slug: ArticleSlug }))
)

export const comment = Route.fromPath("/articles/:slug/comments/:id").pipe(
  Route.decode(Schema.struct({ slug: ArticleSlug, id: CommentId }))
)
