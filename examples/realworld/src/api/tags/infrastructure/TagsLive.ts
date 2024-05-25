import { Schema } from "@effect/schema"
import { ArticleTag } from "@typed/realworld/model"
import { Tags } from "@typed/realworld/services"
import { Unprocessable } from "@typed/realworld/services/errors"
import { Effect } from "effect"
import { sql } from "kysely"
import { RealworldDb } from "../../common/infrastructure/kysely"

const getTags = RealworldDb.schema.findAll({
  Request: Schema.Void,
  Result: Schema.Struct({ tag: ArticleTag }),
  execute: (db) =>
    db.selectFrom("tags as t")
      .innerJoin("article_tags as at", "t.id", "at.tag_id")
      .innerJoin("articles as a", "at.article_id", "a.id")
      .innerJoin("favorites as f", "a.id", "f.article_id")
      .select("t.name as tag")
      .groupBy("t.name")
      .orderBy(sql`count(f.article_id)`, "desc")
      .limit(10)
})(undefined)

export const TagsLive = Tags.implement({
  get: () =>
    getTags.pipe(
      Effect.map((tags) => tags.map((t) => t.tag)),
      Effect.catchAll(() => new Unprocessable({ errors: ["Failed to get tags"] }))
    )
})
