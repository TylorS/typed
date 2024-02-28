import * as Schema from "@effect/schema/Schema"
import { Profile } from "./Profile"

export const CommentId = Schema.number.pipe(Schema.brand("CommentId"))

export type CommentId = Schema.Schema.To<typeof CommentId>

export const CommentBody = Schema.string.pipe(Schema.brand("CommentBody"))

export type CommentBody = Schema.Schema.To<typeof CommentBody>

export const Comment = Schema.struct({
  id: CommentId,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
  body: CommentBody,
  author: Profile
})

export type Comment = Schema.Schema.To<typeof Comment>
