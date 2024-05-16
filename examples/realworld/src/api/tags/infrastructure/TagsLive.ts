import { Schema } from "@effect/schema"
import * as Pg from "@effect/sql-pg"
import { ArticleTag } from "@typed/realworld/model"
import { Tags } from "@typed/realworld/services"
import { Unprocessable } from "@typed/realworld/services/errors"
import { Effect } from "effect"

export const TagsLive = Tags.implement({
  get: () =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.client.PgClient)
      const tags = yield* _(
        undefined,
        Pg.schema.findAll({
          Request: Schema.Void,
          Result: Schema.Struct({ tag: ArticleTag }),
          execute: () =>
            sql`
          SELECT t.name as tag FROM tags t
          JOIN article_tags at ON t.id = at.tag_id
          JOIN articles a ON at.article_id = a.id
          JOIN favorites f ON a.id = f.article_id
          GROUP BY t.name
          ORDER BY count(f.article_id) DESC
          LIMIT 10;
        `
        })
      )

      return tags.map((t) => t.tag)
    }).pipe(
      Effect.catchAll(() => new Unprocessable({ errors: ["Failed to get tags"] }))
    )
})
