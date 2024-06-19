import * as Schema from "@typed/realworld/lib/Schema"
import { Profile } from "@typed/realworld/model/Profile"

export const ArticleId = Schema.nanoId.pipe(
  Schema.brand("ArticleId"),
  Schema.annotations({ description: "Unique identifier for the Article" })
)

export const ArticleSlug = Schema.String.pipe(
  Schema.brand("ArticleSlug"),
  Schema.annotations({ description: "Slug for Article generated from Article.title" })
)
export type ArticleSlug = Schema.Schema.Type<typeof ArticleSlug>

export const ArticleTitle = Schema.String.pipe(
  Schema.brand("ArticleTitle"),
  Schema.annotations({ description: "Title of the Article" })
)
export type ArticleTitle = Schema.Schema.Type<typeof ArticleTitle>

export const ArticleDescription = Schema.String.pipe(
  Schema.brand("ArticleDescription"),
  Schema.annotations({ description: "Description of the Article" })
)
export type ArticleDescription = Schema.Schema.Type<typeof ArticleDescription>

export const ArticleBody = Schema.String.pipe(
  Schema.brand("ArticleBody"),
  Schema.annotations({ description: "Content of the Article" })
)
export type ArticleBody = Schema.Schema.Type<typeof ArticleBody>

export const ArticleTag = Schema.String.pipe(
  Schema.brand("ArticleTag"),
  Schema.annotations({ description: "Tag for the Article" })
)
export type ArticleTag = Schema.Schema.Type<typeof ArticleTag>

export const ArticleTagList = Schema.Array(ArticleTag)
export type ArticleTagList = Schema.Schema.Type<typeof ArticleTagList>

export const Article = Schema.Struct({
  id: ArticleId,
  slug: ArticleSlug,
  title: ArticleTitle,
  description: ArticleDescription,
  body: ArticleBody,
  tagList: ArticleTagList,
  author: Profile,
  favorited: Schema.Boolean,
  favoritesCount: Schema.Number,
  createdAt: Schema.Date,
  updatedAt: Schema.Date
}).pipe(
  Schema.annotations({ identifier: "Article" })
)

export interface Article extends Schema.Schema.Type<typeof Article> {}
