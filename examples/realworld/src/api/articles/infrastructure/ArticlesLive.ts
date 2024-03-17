import { getCurrentJwtUser, getOptionalCurrentJwtUser } from "@/api/common/infrastructure/CurrentJwt"
import { catchExpectedErrors } from "@/api/common/infrastructure/errors"
import { DbArticle, dbArticleToArticle, DbArticleWithFavoritesAndTags, DbTag } from "@/api/common/infrastructure/schema"
import type { UserId } from "@/model"
import { ArticleId, ArticleSlug, ArticleTag } from "@/model"
import { Articles } from "@/services"
import type { CreateArticleInput } from "@/services/CreateArticle"
import { Schema } from "@effect/schema"
import * as Pg from "@sqlfx/pg"
import type { Statement } from "@sqlfx/sql/Statement"
import { makeNanoId } from "@typed/id"
import { Clock, Effect, Option } from "effect"

export const ArticlesLive = Articles.implement({
  get: ({ slug }) =>
    Effect.gen(function*(_) {
      const user = yield* _(getOptionalCurrentJwtUser)

      if (Option.isNone(user)) {
        const dbArticle = yield* _(getArticleFromSlug(slug))
        return dbArticleToArticle(dbArticle)
      }
      const dbArticle = yield* _(getArticleFromSlug(slug, user.value.id))
      const article = dbArticleToArticle(dbArticle)

      return article
    }).pipe(catchExpectedErrors),
  create: (input) =>
    Effect.gen(function*(_) {
      const user = yield* _(getCurrentJwtUser)
      const sql = yield* _(Pg.tag)
      const dbArticle = yield* _(dbArticleFromCreateArticleInput(input, user.id))

      yield* _(sql`insert into articles ${sql.insert(dbArticle)};`)

      const tags = yield* _(tagListToTags(input.tagList))

      yield* _(
        Effect.forEach(
          tags,
          (tag) => sql`insert into article_tags ${sql.insert({ article_id: dbArticle.id, tag_id: tag.id })};`,
          { concurrency: "unbounded" }
        )
      )

      return dbArticleToArticle(
        {
          ...dbArticle,
          author_bio: Option.getOrNull(user.bio),
          author_email: user.email,
          author_following: false,
          author_id: user.id,
          author_image: Option.getOrNull(user.image),
          author_username: user.username,
          favorited: false,
          favorites_count: 0,
          tag_list: input.tagList
        }
      )
    }).pipe(catchExpectedErrors),
  update: (slug, input) =>
    Effect.gen(function*(_) {
      const user = yield* _(getCurrentJwtUser)
      const current = yield* _(getArticleFromSlug(slug, user.id))
      const sql = yield* _(Pg.tag)
      const updatedArticle: DbArticle = {
        ...current,
        slug: input.title ? makeSlugFromTitle(input.title) : current.slug,
        title: input.title ?? current.title,
        description: input.description ?? current.description,
        body: input.body ?? current.body,
        updated_at: new Date(yield* _(Clock.currentTimeMillis))
      }
      const dbArticle = yield* _(
        updatedArticle,
        sql.schemaSingle(
          DbArticle,
          DbArticle,
          (a) =>
            sql`update articles set ${sql.update(a, ["id", "author_id", "created_at"])} where id = ${a.id} returning *;`
        )
      )

      if (input.tagList && input.tagList.length > 0) {
        yield* _(tagListToTags(input.tagList))
      }

      return dbArticleToArticle({
        ...current,
        ...dbArticle,
        tag_list: input.tagList ?? current.tag_list
      })
    }).pipe(catchExpectedErrors),
  delete: ({ slug }) =>
    Effect.gen(function*(_) {
      const user = yield* _(getCurrentJwtUser)
      const sql = yield* _(Pg.tag)
      const article = yield* _(getArticleFromSlug(slug, user.id))

      yield* _(sql`delete from comments where article_id = ${article.id};`)
      yield* _(sql`delete from favorites where article_id = ${article.id};`)
      yield* _(sql`delete from article_tags where article_id = ${article.id};`)
      yield* _(sql`delete from articles where id = ${article.id};`)

      return dbArticleToArticle(article)
    }).pipe(catchExpectedErrors),
  favorite: (slug) =>
    Effect.gen(function*(_) {
      const user = yield* _(getCurrentJwtUser)
      const { id } = yield* _(getArticleFromSlug(slug, user.id))
      const sql = yield* _(Pg.tag)

      yield* _(
        sql`insert into favorites ${sql.insert({ article_id: id, user_id: user.id })} on conflict do nothing;`
      )

      const dbArticle = yield* _(getArticleFromSlug(slug, user.id))

      return dbArticleToArticle(dbArticle)
    }).pipe(catchExpectedErrors),
  unfavorite: (slug) =>
    Effect.gen(function*(_) {
      const user = yield* _(getCurrentJwtUser)
      const { id } = yield* _(getArticleFromSlug(slug, user.id))
      const sql = yield* _(Pg.tag)

      yield* _(
        sql`delete from favorites where article_id = ${id} and user_id = ${user.id};`
      )

      const dbArticle = yield* _(getArticleFromSlug(slug, user.id))

      return dbArticleToArticle(dbArticle)
    }).pipe(catchExpectedErrors),
  list: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)
      const user = yield* _(getOptionalCurrentJwtUser)
      const limit = sql`limit ${Option.getOrElse(input.limit, () => 10)}`
      const offset = sql`offset ${Option.getOrElse(input.offset, () => 0)}`

      const whereConditions: Array<Statement<any>> = []

      if (Option.isSome(input.tag)) {
        whereConditions.push(sql`t.name = ${input.tag.value}`)
      }

      if (Option.isSome(input.author)) {
        whereConditions.push(sql`u.username = ${input.author.value}`)
      }

      if (Option.isSome(input.favorited)) {
        whereConditions.push(sql`fav_user.username = ${input.favorited.value}`)
      }

      const articles = yield* _(
        undefined,
        sql.schema(
          Schema.void,
          DbArticleWithFavoritesAndTags,
          () =>
            sql`
            SELECT
                a.*, 
                u.username AS author_username, 
                u.bio AS author_bio, 
                u.image AS author_image,
                u.email AS author_email,
                COUNT(DISTINCT fav.user_id) AS favorites_count, 
                ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tag_list,
                ${
              Option.match(user, {
                onNone: () => sql`false as favorited, false as author_following`,
                onSome: (u) =>
                  sql`BOOL_OR(fav.user_id = ${u.id}) AS favorited, EXISTS(SELECT 1 FROM follows f WHERE f.followed_id = a.author_id and f.follower_id = ${u.id}) as author_following`
              })
            }
            FROM
                articles a
            JOIN
                users u ON a.author_id = u.id
            LEFT JOIN
                favorites fav ON a.id = fav.article_id
            LEFT JOIN
                users fav_user ON fav.user_id = fav_user.id
            LEFT JOIN
                article_tags at ON a.id = at.article_id
            LEFT JOIN
                tags t ON at.tag_id = t.id
            
            ${
              whereConditions.length > 0
                ? sql`WHERE ${sql.and(whereConditions)}`
                : sql``
            }

            GROUP BY
                a.id, u.username, u.bio, u.image, u.email

            ORDER BY
                a.created_at DESC

            ${limit}
            ${offset};
          `
        )
      )

      return articles.map(dbArticleToArticle)
    }).pipe(catchExpectedErrors),
  feed: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)
      const user = yield* _(getCurrentJwtUser)
      const limit = sql`limit ${Option.getOrElse(input.limit, () => 10)}`
      const offset = sql`offset ${Option.getOrElse(input.offset, () => 0)}`

      const articles = yield* _(
        undefined,
        sql.schema(
          Schema.void,
          DbArticleWithFavoritesAndTags,
          () =>
            sql`
          SELECT 
              a.*, 
              u.username AS author_username, 
              u.bio AS author_bio, 
              u.image AS author_image,
              u.email AS author_email,
              COUNT(DISTINCT fav.user_id) AS favorites_count, 
              ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tag_list, 
              BOOL_OR(fav.user_id = ${user.id}) AS favorited,
              EXISTS(SELECT 1 FROM follows f WHERE f.followed_id = a.author_id and f.follower_id = ${user.id}) as author_following
          FROM
              articles a
          JOIN
              users u ON a.author_id = u.id
          LEFT JOIN 
              favorites fav ON a.id = fav.article_id
          LEFT JOIN
              article_tags at ON a.id = at.article_id
          LEFT JOIN
              tags t ON at.tag_id = t.id
          GROUP BY
              a.id, u.username, u.bio, u.image, u.email
          ORDER BY
              a.created_at DESC
          ${limit}
          ${offset};
          `
        )
      )

      return articles.map(dbArticleToArticle)
    }).pipe(catchExpectedErrors)
})

function dbArticleFromCreateArticleInput(input: CreateArticleInput, author_id: UserId) {
  return Effect.gen(function*(_) {
    const id = ArticleId(yield* _(makeNanoId))
    const now = new Date(yield* _(Clock.currentTimeMillis))
    const article: DbArticle = {
      id,
      title: input.title,
      slug: makeSlugFromTitle(input.title),
      description: input.description,
      body: input.body,
      author_id,
      created_at: now,
      updated_at: now
    }

    return article
  })
}

function getArticleFromSlug(slug: ArticleSlug, currentUserId?: UserId) {
  return Effect.gen(function*(_) {
    const sql = yield* _(Pg.tag)

    if (currentUserId) {
      return yield* _(
        slug,
        sql.schemaSingle(
          ArticleSlug,
          DbArticleWithFavoritesAndTags,
          (s) =>
            sql`SELECT 
            a.*, 
            u.username AS author_username, 
            u.bio AS author_bio, 
            u.image AS author_image,
            u.email AS author_email,
            COUNT(DISTINCT f.user_id) AS favorites_count, 
            ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tag_list, 
            BOOL_OR(f.user_id = ${currentUserId}) AS favorited,
            EXISTS(SELECT 1 FROM follows f WHERE f.followed_id = a.author_id and f.follower_id = ${currentUserId}) as author_following

        FROM 
            articles a
        JOIN 
            users u ON a.author_id = u.id
        LEFT JOIN 
            favorites f ON a.id = f.article_id
        LEFT JOIN 
            article_tags at ON a.id = at.article_id
        LEFT JOIN 
            tags t ON at.tag_id = t.id
        WHERE 
            a.slug = ${s} 
        GROUP BY 
            a.id, u.username, u.bio, u.image, u.email;`
        )
      )
    }

    return yield* _(
      slug,
      sql.schemaSingle(
        ArticleSlug,
        DbArticleWithFavoritesAndTags,
        (s) =>
          sql`SELECT 
            a.*, 
            u.username AS author_username, 
            u.bio AS author_bio, 
            u.image AS author_image,
            u.email AS author_email,
            COUNT(DISTINCT f.user_id) AS favorites_count, 
            ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tag_list, 
            false AS favorited,
            false AS author_following
        FROM 
            articles a
        JOIN 
            users u ON a.author_id = u.id
        LEFT JOIN 
            favorites f ON a.id = f.article_id
        LEFT JOIN 
            article_tags at ON a.id = at.article_id
        LEFT JOIN 
            tags t ON at.tag_id = t.id
        WHERE 
            a.slug = ${s} 
        GROUP BY 
            a.id, u.username, u.bio, u.image, u.email;`
      )
    )
  })
}

function tagListToTags(list: ReadonlyArray<ArticleTag>) {
  return Effect.forEach(
    list,
    (tag) =>
      Effect.gen(function*(_) {
        const sql = yield* _(Pg.tag)
        const existing = yield* _(
          tag,
          sql.schemaSingleOption(ArticleTag, DbTag, (t) => sql`select * from tags where name = ${t};`)
        )

        if (Option.isSome(existing)) {
          return existing.value
        }

        const id = yield* _(makeNanoId)
        yield* _(sql`insert into tags ${sql.insert({ id, name: tag })};`)

        return {
          id,
          name: tag
        }
      }),
    {
      concurrency: "unbounded"
    }
  )
}

function makeSlugFromTitle(title: string) {
  return ArticleSlug(title.toLowerCase().replace(/\s/g, "-"))
}
