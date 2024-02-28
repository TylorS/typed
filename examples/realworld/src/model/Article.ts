import * as Schema from "@effect/schema/Schema"
import { Profile } from "./Profile"

export const ArticleSlug = Schema.string.pipe(Schema.brand("ArticleSlug"))
export type ArticleSlug = Schema.Schema.To<typeof ArticleSlug>

export const ArticleTitle = Schema.string.pipe(Schema.brand("ArticleTitle"))
export type ArticleTitle = Schema.Schema.To<typeof ArticleTitle>

export const ArticleDescription = Schema.string.pipe(Schema.brand("ArticleDescription"))
export type ArticleDescription = Schema.Schema.To<typeof ArticleDescription>

export const ArticleBody = Schema.string.pipe(Schema.brand("ArticleBody"))
export type ArticleBody = Schema.Schema.To<typeof ArticleBody>

export const ArticleTag = Schema.string.pipe(Schema.brand("ArticleTag"))
export type ArticleTag = Schema.Schema.To<typeof ArticleTag>

export const Article = Schema.struct({
  slug: ArticleSlug,
  title: ArticleTitle,
  description: ArticleDescription,
  body: ArticleBody,
  tagList: Schema.array(ArticleTag),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
  favorited: Schema.boolean,
  favoritesCount: Schema.number,
  author: Profile
})

export type Article = Schema.Schema.To<typeof Article>
