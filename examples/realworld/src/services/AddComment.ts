import { CommentBody } from "@/model"
import type { ArticleSlug, Comment, JwtToken } from "@/model"
import { Schema } from "@effect/schema"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { InvalidTokenError } from "./errors"

export const AddCommentInput = Schema.struct({ body: CommentBody })
export type AddCommentInput = Schema.Schema.To<typeof AddCommentInput>

export type AddCommentError = InvalidTokenError

export const AddComment = Context.Fn<
  (slug: ArticleSlug, input: AddCommentInput, token: JwtToken) => Effect<Comment, AddCommentError>
>()(
  (_) => class AddComment extends _("articles/AddComment") {}
)

export type AddComment = Context.Fn.Identifier<typeof AddComment>
