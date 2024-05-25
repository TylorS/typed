import * as S from "@typed/realworld/lib/Schema"
import type { Article, Comment, Profile, User } from "@typed/realworld/model"
import {
  ArticleBody,
  ArticleDescription,
  ArticleId,
  ArticleSlug,
  ArticleTag,
  ArticleTitle,
  Bio,
  CommentBody,
  CommentId,
  Email,
  Image,
  JwtToken,
  PasswordHash,
  UserId,
  Username
} from "@typed/realworld/model"
import { Option } from "effect"

export const DbUser = S.Struct({
  id: UserId,
  email: Email,
  username: Username,
  password: PasswordHash,
  bio: S.NullOr(Bio),
  image: S.NullOr(Image),
  created_at: S.ValidDateFromSelf,
  updated_at: S.ValidDateFromSelf
})

export function dbUserToUser(user: Omit<DbUser, "password">, token: JwtToken): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    bio: fromNullableString(user.bio),
    image: fromNullableString(user.image),
    token
  }
}

function fromNullableString<T extends string>(value: T | null | undefined): Option.Option<NonNullable<T>> {
  return Option.filter(Option.fromNullable(value), (x) => x.length > 0)
}

export type DbUser = S.Schema.Type<typeof DbUser>
export type DbUserEncoded = S.Schema.Encoded<typeof DbUser>

export const DbArticle = S.Struct({
  id: ArticleId,
  author_id: UserId,
  slug: ArticleSlug,
  title: ArticleTitle,
  description: ArticleDescription,
  body: ArticleBody,
  created_at: S.ValidDateFromSelf,
  updated_at: S.ValidDateFromSelf
})

export function dbArticleToArticle(
  article: DbArticleWithFavoritesAndTags
): Article {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    author: dbProfileJoinToProfile(article),
    tagList: article.tag_list,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
    favorited: article?.favorited ?? false,
    favoritesCount: article?.favorites_count ?? 0
  }
}

export type DbArticle = S.Schema.Type<typeof DbArticle>
export type DbArticleEncoded = S.Schema.Encoded<typeof DbArticle>

export const DbProfile = DbUser.pipe(S.pick("username", "email", "bio", "image"))

export type DbProfile = S.Schema.Type<typeof DbProfile>
export type DbProfileEncoded = S.Schema.Encoded<typeof DbProfile>

const DbProfileJoin = S.Struct({
  author_username: Username,
  author_email: Email,
  author_bio: S.NullOr(Bio),
  author_image: S.NullOr(Image),
  author_following: S.NullOr(S.Boolean)
})

type DbProfileJoin = S.Schema.Type<typeof DbProfileJoin>

export const DbArticleWithFavoritesAndTags = DbArticle.pipe(
  S.extend(
    S.Struct({
      ...DbProfileJoin.fields,
      favorites_count: S.NumberFromString,
      favorited: S.NullOr(S.Boolean),
      tag_list: S.Array(ArticleTag)
    })
  )
)
export type DbArticleWithFavoritesAndTags = S.Schema.Type<typeof DbArticleWithFavoritesAndTags>

export const DbComment = S.Struct({
  id: CommentId,
  article_id: ArticleId,
  author_id: UserId,
  body: CommentBody,
  created_at: S.ValidDateFromSelf,
  updated_at: S.ValidDateFromSelf
})

export type DbComment = S.Schema.Type<typeof DbComment>
export type DbCommentEncoded = S.Schema.Encoded<typeof DbComment>

export const DbCommentWithAuthor = DbComment.pipe(S.extend(DbProfileJoin))

export type DbCommentWithAuthor = S.Schema.Type<typeof DbCommentWithAuthor>

export function dbCommentToComment(db: DbCommentWithAuthor): Comment {
  return {
    id: db.id,
    body: db.body,
    author: dbProfileJoinToProfile(db),
    createdAt: db.created_at,
    updatedAt: db.updated_at
  }
}

function dbProfileJoinToProfile(db: DbProfileJoin): Profile {
  return {
    email: db.author_email,
    username: db.author_username,
    bio: fromNullableString(db.author_bio),
    image: fromNullableString(db.author_image),
    following: db.author_following ?? false
  }
}

export const DbTag = S.Struct({
  id: S.nanoId,
  name: ArticleTag
})

export type DbTag = S.Schema.Type<typeof DbTag>
export type DbTagEncoded = S.Schema.Encoded<typeof DbTag>

export const DbArticleTag = S.Struct({
  article_id: ArticleId,
  tag_id: ArticleTag
})

export type DbArticleTag = S.Schema.Type<typeof DbArticleTag>
export type DbArticleTagEncoded = S.Schema.Encoded<typeof DbArticleTag>

export const DbFavorite = S.Struct({
  user_id: UserId,
  article_id: ArticleId
})

export type DbFavorite = S.Schema.Type<typeof DbFavorite>
export type DbFavoriteEncoded = S.Schema.Encoded<typeof DbFavorite>

export const DbFollow = S.Struct({
  follower_id: UserId,
  followee_id: UserId
})

export type DbFollow = S.Schema.Type<typeof DbFollow>
export type DbFollowEncoded = S.Schema.Encoded<typeof DbFollow>

export const DbJwtToken = S.Struct({
  id: S.nanoId,
  user_id: UserId,
  token: JwtToken,
  created_at: S.ValidDateFromSelf
})

export type DbJwtToken = S.Schema.Type<typeof DbJwtToken>
export type DbJwtTokenEncoded = S.Schema.Encoded<typeof DbJwtToken>
