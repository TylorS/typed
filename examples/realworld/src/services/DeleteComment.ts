import * as Schema from "@realworld/lib/Schema"
import type { ArticleSlug } from "@realworld/model"
import { CommentId } from "@realworld/model"
import type { Unauthorized, Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const DeleteCommentInput = Schema.Struct({ id: CommentId }).pipe(Schema.identifier("DeleteCommentInput"))
export type DeleteCommentInput = Schema.Schema.Type<typeof DeleteCommentInput>

export type DeleteCommentError = Unauthorized | Unprocessable

export const DeleteComment = Fn<
  (slug: ArticleSlug, input: DeleteCommentInput) => Effect.Effect<void, DeleteCommentError>
>()("DeleteComment")
export type DeleteComment = Fn.Identifier<typeof DeleteComment>
