import * as Schema from "lib/Schema"
import { Profile } from "./Profile"

export const Comment = Schema.suspend(() =>
  Schema.struct({
    id: CommentId,
    body: CommentBody,
    author: Profile,
    createdAt: Schema.Date,
    updatedAt: Schema.Date
  })
).pipe(Schema.identifier("Comment"))

export type Comment = Schema.Schema.To<typeof Comment>

export const CommentId = Schema.nanoId.pipe(Schema.brand("CommentId"))
export type CommentId = Schema.Schema.To<typeof CommentId>

export const CommentBody = Schema.string.pipe(Schema.brand("CommentBody"))
export type CommentBody = Schema.Schema.To<typeof CommentBody>
