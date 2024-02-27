import { Schema } from "@effect/schema"
// import * as Pg from "@sqlfx/pg"
import { Article, ArticleSlug, ArticleTag, Comment, Email, JwtToken, User } from "@/domain"

const timestampsAndDeleted = {
  created_at: Schema.DateFromString,
  updated_at: Schema.DateFromString,
  deleted: Schema.boolean
} as const

export const DbUser = User.pipe(
  Schema.omit("token"),
  Schema.extend(Schema.struct({
    password: Schema.Secret,
    ...timestampsAndDeleted
  }))
)
export type DbUser = Schema.Schema.From<typeof DbUser>

export const DbArticle = Article.pipe(
  Schema.omit("author", "favorited", "favoritesCount", "tagList"),
  Schema.extend(Schema.struct({ author: Email, ...timestampsAndDeleted }))
)

export type DbArticle = Schema.Schema.From<typeof DbArticle>

export const DbComment = Comment.pipe(
  Schema.omit("author"),
  Schema.extend(Schema.struct({ author: Email, ...timestampsAndDeleted }))
)
export type DbComment = Schema.Schema.From<typeof DbComment>

export const DbFavorite = Schema.struct({
  user_email: Email,
  article_slug: ArticleSlug,
  created_at: Schema.DateFromString,
  deleted: Schema.boolean
})
export type DbFavorite = Schema.Schema.From<typeof DbFavorite>

export const DbFollower = Schema.struct({
  follower: Email,
  followed: Email,
  created_at: Schema.DateFromString,
  deleted: Schema.boolean
})
export type DbFollower = Schema.Schema.From<typeof DbFollower>

export const DbTag = Schema.struct({
  tag: ArticleTag,
  created_at: Schema.DateFromString,
  deleted: Schema.boolean
})
export type DbTag = Schema.Schema.From<typeof DbTag>

export const DbArticleTag = Schema.struct({
  article_slug: ArticleSlug,
  tag: ArticleTag,
  created_at: Schema.DateFromString,
  deleted: Schema.boolean
})
export type DbArticleTag = Schema.Schema.From<typeof DbArticleTag>

export const DbJwt = Schema.struct({
  user_email: Email,
  jwt: JwtToken,
  created_at: Schema.DateFromString,
  expires_at: Schema.DateFromString,
  revoked: Schema.boolean
})
export type DbJwt = Schema.Schema.From<typeof DbJwt>
