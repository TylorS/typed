import { Comment } from "@/model"
import { Fn } from "@typed/context"
import type { Effect } from "effect"
import * as Schema from "lib/Schema"

export const CreateCommentInput = Comment.pipe(Schema.omit("id", "author", "createdAt", "updatedAt"))
export type CreateCommentInput = Schema.Schema.To<typeof CreateCommentInput>

export const CreateComment = Fn<(input: CreateCommentInput) => Effect.Effect<Comment>>()("CreateComment")
export type CreateComment = Fn.Identifier<typeof CreateComment>
