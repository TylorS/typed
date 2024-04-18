import * as S from "@/lib/Schema"
import type { Article, Comment, Profile, User } from "@/model"
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
} from "@/model"
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
    bio: Option.fromNullable(user.bio),
    image: Option.fromNullable(user.image),
    token
  }
}

export type DbUser = S.Schema.Type<typeof DbUser>

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

export const DbProfile = DbUser.pipe(S.pick("username", "email", "bio", "image"))

export type DbProfile = S.Schema.Type<typeof DbProfile>

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
    bio: Option.fromNullable(db.author_bio),
    image: Option.fromNullable(db.author_image),
    following: db.author_following ?? false
  }
}

export const DbTag = S.Struct({
  id: S.nanoId,
  name: ArticleTag
})

export type DbTag = S.Schema.Type<typeof DbTag>

export const DbArticleTag = S.Struct({
  article_id: ArticleId,
  tag_id: ArticleTag
})

export type DbArticleTag = S.Schema.Type<typeof DbArticleTag>

export const DbFavorite = S.Struct({
  user_id: UserId,
  article_id: ArticleId
})

export type DbFavorite = S.Schema.Type<typeof DbFavorite>

export const DbFollow = S.Struct({
  follower_id: UserId,
  followee_id: UserId
})

export type DbFollow = S.Schema.Type<typeof DbFollow>

export const DbJwtToken = S.Struct({
  id: S.nanoId,
  user_id: UserId,
  token: JwtToken,
  created_at: S.ValidDateFromSelf
})

export type DbJwtToken = S.Schema.Type<typeof DbJwtToken>
