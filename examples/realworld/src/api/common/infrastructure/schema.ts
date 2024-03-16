import * as S from "@/lib/Schema"
import type { User } from "@/model"
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

export const DbUser = S.struct({
  id: UserId,
  email: Email,
  username: Username,
  password: PasswordHash,
  bio: S.nullable(Bio),
  image: S.nullable(Image),
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

export const DbArticle = S.struct({
  id: ArticleId,
  author_id: UserId,
  slug: ArticleSlug,
  title: ArticleTitle,
  description: ArticleDescription,
  body: ArticleBody,
  created_at: S.ValidDateFromSelf,
  updated_at: S.ValidDateFromSelf
})

export type DbArticle = S.Schema.Type<typeof DbArticle>

export const DbComment = S.struct({
  id: CommentId,
  article_id: ArticleId,
  author_id: UserId,
  body: CommentBody,
  created_at: S.ValidDateFromSelf,
  updated_at: S.ValidDateFromSelf
})

export type DbComment = S.Schema.Type<typeof DbComment>

export const DbTag = S.struct({
  id: S.nanoId,
  name: ArticleTag
})

export type DbTag = S.Schema.Type<typeof DbTag>

export const DbArticleTag = S.struct({
  article_id: ArticleId,
  tag_id: ArticleTag
})

export type DbArticleTag = S.Schema.Type<typeof DbArticleTag>

export const DbFavorite = S.struct({
  user_id: UserId,
  article_id: ArticleId
})

export type DbFavorite = S.Schema.Type<typeof DbFavorite>

export const DbFollow = S.struct({
  follower_id: UserId,
  followee_id: UserId
})

export type DbFollow = S.Schema.Type<typeof DbFollow>

export const DbJwtToken = S.struct({
  id: S.nanoId,
  user_id: UserId,
  token: JwtToken,
  created_at: S.ValidDateFromSelf
})

export type DbJwtToken = S.Schema.Type<typeof DbJwtToken>
