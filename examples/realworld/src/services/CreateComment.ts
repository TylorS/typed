import { Fn } from "@typed/context"
import * as Schema from "@typed/realworld/lib/Schema"
import type { ArticleSlug } from "@typed/realworld/model"
import { Comment } from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
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
