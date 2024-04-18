import * as Schema from "lib/Schema"
import { Profile } from "./Profile"

export const CommentId = Schema.nanoId.pipe(Schema.brand("CommentId"), Schema.description("Nano ID for Comment"))
export type CommentId = Schema.Schema.Type<typeof CommentId>

export const CommentBody = Schema.String.pipe(Schema.brand("CommentBody"), Schema.description("Comment Body"))
export type CommentBody = Schema.Schema.Type<typeof CommentBody>

export const Comment = Schema.Struct({
  id: CommentId,
  body: CommentBody,
  author: Profile,
  createdAt: Schema.Date,
  updatedAt: Schema.Date
}).pipe(Schema.identifier("Comment"))

export interface Comment extends Schema.Schema.Type<typeof Comment> {}
