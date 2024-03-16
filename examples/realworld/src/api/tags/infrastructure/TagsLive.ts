import { DbArticleTag } from "@/api/common/infrastructure/schema"
import { Tags } from "@/services"
import { Unprocessable } from "@/services/errors"
import { Schema } from "@effect/schema"
import * as Pg from "@sqlfx/pg"
import { Effect } from "effect"

export const TagsLive = Tags.implement({
  get: () =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)
      const tags = yield* _(
        undefined,
        sql.schema(Schema.void, DbArticleTag, () => sql`select * from article_tags;`)
      )
      return tags.map((t) => t.tag_id)
    }).pipe(Effect.catchAll(() => new Unprocessable({ errors: ["Failed to get tags"] })))
})
