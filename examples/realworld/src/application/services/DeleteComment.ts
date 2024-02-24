import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { ArticleSlug, Comment, CommentId, JwtToken } from "../../domain"

export const DeleteComment = Context.Fn<(slug: ArticleSlug, id: CommentId, token: JwtToken) => Effect<Comment>>()((_) =>
  class DeleteComment extends _("articles/DeleteComment") {}
)

export type DeleteComment = Context.Fn.Identifier<typeof DeleteComment>
