import * as Schema from "lib/Schema"

export const ArticleSlug = Schema.string.pipe(
  Schema.brand("ArticleSlug"),
  Schema.description("Slug for Article generated from Article.title")
)
export type ArticleSlug = Schema.Schema.To<typeof ArticleSlug>

export const ArticleTitle = Schema.string.pipe(Schema.brand("ArticleTitle"), Schema.description("Title of the Article"))
export type ArticleTitle = Schema.Schema.To<typeof ArticleTitle>

export const ArticleDescription = Schema.string.pipe(
  Schema.brand("ArticleDescription"),
  Schema.description("Description of the Article")
)
export type ArticleDescription = Schema.Schema.To<typeof ArticleDescription>

export const ArticleBody = Schema.string.pipe(Schema.brand("ArticleBody"), Schema.description("Content of the Article"))
export type ArticleBody = Schema.Schema.To<typeof ArticleBody>

export const ArticleTag = Schema.string.pipe(Schema.brand("ArticleTag"), Schema.description("Tag for the Article"))
export type ArticleTag = Schema.Schema.To<typeof ArticleTag>

export const ArticleTagList = Schema.array(ArticleTag)
export type ArticleTagList = Schema.Schema.To<typeof ArticleTagList>

export const Article = Schema.struct({
  slug: ArticleSlug,
  title: ArticleTitle,
  description: ArticleDescription,
  body: ArticleBody,
  tagList: ArticleTagList,
  favorited: Schema.boolean,
  favoritesCount: Schema.number,
  createdAt: Schema.Date,
  updatedAt: Schema.Date
}).pipe(
  Schema.identifier("Article")
)

export type Article = Schema.Schema.To<typeof Article>
