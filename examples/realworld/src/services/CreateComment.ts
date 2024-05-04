import * as Schema from "@realworld/lib/Schema"
import type { ArticleSlug } from "@realworld/model"
import { Comment } from "@realworld/model"
import type { Unauthorized, Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const CreateCommentInput = Comment.pipe(
  Schema.omit("id", "author", "createdAt", "updatedAt"),
  Schema.identifier("CreateCommentInput")
)
export type CreateCommentInput = Schema.Schema.Type<typeof CreateCommentInput>

export type CreateCommentError = Unauthorized | Unprocessable

export const CreateComment = Fn<
  (slug: ArticleSlug, input: CreateCommentInput) => Effect.Effect<Comment, CreateCommentError>
>()("CreateComment")

export type CreateComment = Fn.Identifier<typeof CreateComment>
