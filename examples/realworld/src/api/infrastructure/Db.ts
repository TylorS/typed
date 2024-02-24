import { Schema } from "@effect/schema"
import * as Pg from "@sqlfx/pg"
import { Article, ArticleSlug, Comment, Email, User } from "../../domain"

export const DbArticle = Article.pipe(
  Schema.omit("author", "favorited", "favoritesCount"),
  Schema.extend(Schema.struct({ author: Email }))
)

export type DbArticle = Schema.Schema.To<typeof DbArticle>

export const DbFavorite = Schema.struct({
  email: Email,
  slug: ArticleSlug
})

export const DbFollower = Schema.struct({
  following: Email,
  follower: Email
})

export const Db = {
  article: DbArticle,
  comment: Comment,
  favorite: DbFavorite,
  user: User
} as const
