import * as Schema from "lib/Schema"
import { Profile } from "./Profile"

export const CommentId = Schema.nanoId.pipe(Schema.brand("CommentId"), Schema.description("Nano ID for Comment"))
export type CommentId = Schema.Schema.To<typeof CommentId>

export const CommentBody = Schema.string.pipe(Schema.brand("CommentBody"), Schema.description("Comment Body"))
export type CommentBody = Schema.Schema.To<typeof CommentBody>

export const Comment = Schema.struct({
  id: CommentId,
  body: CommentBody,
  author: Profile,
  createdAt: Schema.Date,
  updatedAt: Schema.Date
}).pipe(Schema.identifier("Comment"))

export type Comment = Schema.Schema.To<typeof Comment>
