import { Schema } from "@effect/schema"
import * as Sql from "@effect/sql"
import { makeNanoId } from "@typed/id"
import { getCurrentJwtUser, getOptionalCurrentJwtUser } from "@typed/realworld/api/common/infrastructure/CurrentJwt"
import { catchExpectedErrors } from "@typed/realworld/api/common/infrastructure/errors"
import type { DbComment } from "@typed/realworld/api/common/infrastructure/schema"
import { dbCommentToComment, DbCommentWithAuthor } from "@typed/realworld/api/common/infrastructure/schema"
import type { User } from "@typed/realworld/model"
import { ArticleId, ArticleSlug, CommentId } from "@typed/realworld/model"
import { Comments } from "@typed/realworld/services"
import type { CreateCommentInput } from "@typed/realworld/services/CreateComment"
import { Clock, Effect, Option } from "effect"

export const CommentsLive = Comments.implement({
  get: (slug) =>
    Effect.gen(function*(_) {
      const user = yield* _(getOptionalCurrentJwtUser)

      const sql = yield* _(Sql.client.Client)
      const dbComments = yield* _(
        slug,
        Sql.schema.findAll({
          Request: ArticleSlug,
          Result: DbCommentWithAuthor,
          execute: (s) =>
            sql`
          SELECT c.*, u.username as author_username, u.bio as author_bio, u.image as author_image, u.email as author_email, 
                  ${
              Option.match(user, {
                onNone: () => sql`false as author_following`,
                onSome: (u) =>
                  sql`exists (select 1 from follows f where f.follower_id = ${u.id} and f.followed_id = u.id) as author_following`
              })
            }
          FROM comments c
          JOIN users u ON c.author_id = u.id
          LEFT JOIN articles a ON c.article_id = a.id
          WHERE a.slug = ${s};
        `
        })
      )

      return dbComments.map(dbCommentToComment)
    }).pipe(catchExpectedErrors),
  create: (slug, input) =>
    Effect.gen(function*(_) {
      const user = yield* _(getCurrentJwtUser)
      const sql = yield* _(Sql.client.Client)
      const comment = yield* _(createDbComment(user, slug, input))

      yield* _(
        sql`insert into comments ${sql.insert(comment)};`
      )

      return dbCommentToComment({
        ...comment,
        author_email: user.email,
        author_username: user.username,
        author_image: Option.getOrNull(user.image),
        author_bio: Option.getOrNull(user.bio),
        author_following: false
      })
    }).pipe(catchExpectedErrors),
  delete: (_, { id }) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Sql.client.Client)
      const user = yield* _(getCurrentJwtUser)
      yield* _(sql`DELETE FROM comments WHERE id = ${id} AND author_id = ${user.id};`)
    }).pipe(catchExpectedErrors)
})

function createDbComment(user: User, slug: ArticleSlug, input: CreateCommentInput) {
  return Effect.gen(function*(_) {
    const id = CommentId.make(yield* _(makeNanoId))
    const article_id = yield* _(getArticleIdBySlug(slug))
    const now = new Date(yield* _(Clock.currentTimeMillis))
    const comment: DbComment = {
      id,
      article_id,
      body: input.body,
      author_id: user.id,
      created_at: now,
      updated_at: now
    }

    return comment
  })
}

function getArticleIdBySlug(slug: ArticleSlug) {
  return Effect.gen(function*(_) {
    const sql = yield* _(Sql.client.Client)
    const { id } = yield* _(
      slug,
      Sql.schema.single(
        {
          Request: ArticleSlug,
          Result: Schema.Struct({ id: ArticleId }),
          execute: (s) => sql`select id from articles where slug = ${s}`
        }
      )
    )

    return id
  })
}
