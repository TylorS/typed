import { Fn } from "@typed/context"
import * as Schema from "@typed/realworld/lib/Schema"
import type { ArticleSlug } from "@typed/realworld/model"
import { CommentId } from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export const DeleteCommentInput = Schema.Struct({ id: CommentId }).pipe(
  Schema.annotations({ identifier: "DeleteCommentInput" })
)
export type DeleteCommentInput = Schema.Schema.Type<typeof DeleteCommentInput>

export type DeleteCommentError = Unauthorized | Unprocessable

export const DeleteComment = Fn<
  (slug: ArticleSlug, input: DeleteCommentInput) => Effect.Effect<void, DeleteCommentError>
>()("DeleteComment")
export type DeleteComment = Fn.Identifier<typeof DeleteComment>
