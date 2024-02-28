import { Article, ArticleSlug, ArticleTag, Comment, Email, JwtToken, User } from "@/model"
import { Schema } from "@effect/schema"
import * as Pg from "@sqlfx/pg"
import * as Migrator from "@sqlfx/pg/Migrator"
import { Tagged } from "@typed/context"
import { Config, Effect, Layer, Secret } from "effect"

const timestampsAndDeleted = {
  created_at: Schema.DateFromSelf,
  updated_at: Schema.DateFromSelf,
  deleted: Schema.boolean
} as const

export const DbUser = User.pipe(
  Schema.omit("token"),
  Schema.extend(Schema.struct({
    password: Schema.Secret,
    ...timestampsAndDeleted
  }))
)
export type DbUser = Schema.Schema.To<typeof DbUser>

export const DbArticle = Article.pipe(
  Schema.omit("author", "favorited", "favoritesCount", "tagList"),
  Schema.extend(Schema.struct({ author: Email, ...timestampsAndDeleted }))
)

export type DbArticle = Schema.Schema.To<typeof DbArticle>

export const DbComment = Comment.pipe(
  Schema.omit("author"),
  Schema.extend(Schema.struct({ author: Email, ...timestampsAndDeleted }))
)
export type DbComment = Schema.Schema.To<typeof DbComment>

export const DbFavorite = Schema.struct({
  user_email: Email,
  article_slug: ArticleSlug,
  created_at: Schema.DateFromSelf,
  deleted: Schema.boolean
})
export type DbFavorite = Schema.Schema.To<typeof DbFavorite>

export const DbFollower = Schema.struct({
  follower: Email,
  followed: Email,
  created_at: Schema.DateFromSelf,
  deleted: Schema.boolean
})
export type DbFollower = Schema.Schema.To<typeof DbFollower>

export const DbTag = Schema.struct({
  tag: ArticleTag,
  created_at: Schema.DateFromSelf,
  deleted: Schema.boolean
})
export type DbTag = Schema.Schema.To<typeof DbTag>

export const DbArticleTag = Schema.struct({
  article_slug: ArticleSlug,
  tag: ArticleTag,
  created_at: Schema.DateFromSelf,
  deleted: Schema.boolean
})
export type DbArticleTag = Schema.Schema.To<typeof DbArticleTag>

export const DbJwt = Schema.struct({
  user_email: Email,
  jwt: JwtToken,
  created_at: Schema.DateFromSelf,
  expires_at: Schema.DateFromSelf,
  revoked: Schema.boolean
})
export type DbJwt = Schema.Schema.To<typeof DbJwt>

const PgLive = Pg.makeLayer({
  username: Config.succeed("effect_pg_dev"),
  password: Config.succeed(Secret.fromString("effect_pg_dev")),
  database: Config.succeed("effect_pg_dev")
})

const migrations = import.meta.glob("./migrations/*")

export const DbLive = Layer.mergeAll(
  Layer.provide(
    Migrator.makeLayer({ loader: Migrator.fromGlob(migrations) }),
    PgLive
  ),
  PgLive
)

export const makeDbServices = Effect.gen(function*(_) {
  const sql = yield* _(Pg.tag)
  const getUserByEmail = sql.resolverId("getUserByEmail", {
    id: Schema.string,
    result: DbUser,
    resultId: (_) => _.email,
    run: (ids) => sql`SELECT * FROM users WHERE email IN ${sql(ids)} AND deleted = false;`
  }).execute

  const getUserByUsername = sql.resolverId("getUserByUsername", {
    id: Schema.string,
    result: DbUser,
    resultId: (_) => _.username,
    run: (ids) => sql`SELECT * FROM users WHERE username IN ${sql(ids)} AND deleted = false;`
  }).execute

  const createUser = sql.resolver("createUser", {
    request: DbUser,
    result: DbUser,
    run: (user) =>
      sql`
    INSERT INTO users
    ${sql.insert(user)}
    Returning *;
  `
  }).execute

  const updateUser = sql.schemaSingle(DbUser, DbUser, (user) =>
    sql`
    UPDATE users
    SET updated_at = ${user.updated_at},
        deleted = ${user.deleted},
        ${user.bio === undefined ? sql.unsafe("") : sql`bio = ${user.bio},`}
        ${user.image === undefined ? sql.unsafe("") : sql`image = ${user.image}`}
    WHERE email = ${user.email}
    RETURNING *;
  `)

  const getJwt = sql.resolverId("getJwt", {
    id: Schema.string,
    result: DbJwt,
    resultId: (_) => _.jwt,
    run: (ids) => sql`SELECT * FROM jwts WHERE jwt IN ${sql(ids)} AND revoked = false AND expires_at > NOW();`
  }).execute

  const getJwtByEmail = sql.resolverId("getJwt", {
    id: Schema.string,
    result: DbJwt,
    resultId: (_) => _.user_email,
    run: (ids) => sql`SELECT * FROM jwts WHERE user_email IN ${sql(ids)} AND revoked = false AND expires_at > NOW();`
  }).execute

  const saveJwt = sql.resolver("saveJwt", {
    request: DbJwt,
    result: DbJwt,
    run: (jwt) =>
      sql`
    INSERT INTO jwts
    ${sql.insert(jwt)}
    Returning *;
  `
  }).execute

  return {
    createUser,
    getJwt,
    getJwtByEmail,
    getUserByEmail,
    getUserByUsername,
    saveJwt,
    updateUser
  } as const
})

export interface DbServices extends Effect.Effect.Success<typeof makeDbServices> {}

const DbServicesTag = Tagged<DbServices>("DbServices")

export const DbServices = Object.assign(
  DbServicesTag,
  {
    Live: DbServicesTag.layer(makeDbServices)
  }
)
