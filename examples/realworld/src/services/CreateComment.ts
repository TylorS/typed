import type { ArticleSlug } from "@/model"
import { Comment } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"
import * as Schema from "lib/Schema"

export const CreateCommentInput = Comment.pipe(
  Schema.omit("id", "author", "createdAt", "updatedAt"),
  Schema.identifier("CreateCommentInput")
)
export type CreateCommentInput = Schema.Schema.Type<typeof CreateCommentInput>

export type CreateCommentError = Unauthorized | Unprocessable

export const CreateComment = Fn<
  (slug: ArticleSlug, input: CreateCommentInput) => Effect.Effect<Comment, CreateCommentError>
>()(
  "CreateComment"
)
export type CreateComment = Fn.Identifier<typeof CreateComment>
