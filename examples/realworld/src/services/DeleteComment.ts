import type { ArticleSlug } from "@/model"
import { CommentId } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"
import * as Schema from "lib/Schema"

export const DeleteCommentInput = Schema.Struct({ id: CommentId }).pipe(Schema.identifier("DeleteCommentInput"))
export type DeleteCommentInput = Schema.Schema.Type<typeof DeleteCommentInput>

export type DeleteCommentError = Unauthorized | Unprocessable

export const DeleteComment = Fn<
  (slug: ArticleSlug, input: DeleteCommentInput) => Effect.Effect<void, DeleteCommentError>
>()("DeleteComment")
export type DeleteComment = Fn.Identifier<typeof DeleteComment>
