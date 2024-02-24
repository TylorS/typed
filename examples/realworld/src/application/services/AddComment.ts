import { Schema } from "@effect/schema"
import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import { CommentBody } from "../../domain"
import type { ArticleSlug, Comment, JwtToken } from "../../domain"
import type { RealworldError } from "./errors"

export const AddCommentInput = Schema.struct({ body: CommentBody })
export type AddCommentInput = Schema.Schema.To<typeof AddCommentInput>

export const AddComment = Context.Fn<
  (slug: ArticleSlug, input: AddCommentInput, token: JwtToken) => Effect<Comment, RealworldError>
>()(
  (_) => class AddComment extends _("articles/AddComment") {}
)

export type AddComment = Context.Fn.Identifier<typeof AddComment>
