import type { Article, ArticleTag, JwtToken, Profile, User } from "@/model"
import type { DbArticle, DbUser } from "./Db"

export function dbUserToUser(user: DbUser, token: JwtToken): User {
  return {
    email: user.email,
    username: user.username,
    bio: user.bio,
    image: user.image,
    token
  }
}

export function dbArticleToArticle(
  { article, author, favorited, favoritesCount, tags }: {
    article: DbArticle
    author: Profile
    favorited: boolean
    favoritesCount: number
    tags: ReadonlyArray<ArticleTag>
  }
): Article {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: tags,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
    favorited,
    favoritesCount,
    author
  }
}
