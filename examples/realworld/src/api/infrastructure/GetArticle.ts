import { GetArticle } from "@/services"
import * as Pg from "@sqlfx/pg"
import { Effect } from "effect"

export const GetArticleLive = GetArticle.implement((slug) =>
  Effect.gen(function*(_) {
    const sql = yield* _(Pg.tag)
    const [article] = yield* _(sql`
      SELECT articles.*, users.name AS author, tags.name AS tag, COUNT(favorites.article_id) AS favorites_count
      FROM articles
      JOIN users ON articles.author_id = users.id
      JOIN article_tags ON articles.id = article_tags.article_id
      JOIN tags ON article_tags.tag_id = tags.id
      LEFT JOIN favorites ON articles.id = favorites.article_id
      WHERE articles.slug = ${slug}
      GROUP BY articles.id, users.name, tags.name
    `)

    return article
  })
)
