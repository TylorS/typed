import { Schema } from "@effect/schema"
import * as Pg from "@sqlfx/pg"
import { Effect } from "effect"
import { AddComment } from "../../application/services"
import { Comment } from "../../domain"

const decodeComment = Schema.decodeUnknown(Comment)

export const AddCommentLive = AddComment.implement((slug, input, token) =>
  Effect.gen(function*(_) {
    const sql = yield* _(Pg.tag)
    const statement = sql.unsafe(``)
    const result = yield* _(statement)

    return yield* _(decodeComment(result))
  }).pipe(
    Effect.catchTag("SqlError", (e) => Effect.fail())
  )
)
