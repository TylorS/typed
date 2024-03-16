import * as Schema from "@/lib/Schema"

export const ArticleId = Schema.nanoId.pipe(
  Schema.brand("ArticleId"),
  Schema.description("Unique identifier for the Article")
)

export const ArticleSlug = Schema.string.pipe(
  Schema.brand("ArticleSlug"),
  Schema.description("Slug for Article generated from Article.title")
)
export type ArticleSlug = Schema.Schema.Type<typeof ArticleSlug>

export const ArticleTitle = Schema.string.pipe(Schema.brand("ArticleTitle"), Schema.description("Title of the Article"))
export type ArticleTitle = Schema.Schema.Type<typeof ArticleTitle>

export const ArticleDescription = Schema.string.pipe(
  Schema.brand("ArticleDescription"),
  Schema.description("Description of the Article")
)
export type ArticleDescription = Schema.Schema.Type<typeof ArticleDescription>

export const ArticleBody = Schema.string.pipe(Schema.brand("ArticleBody"), Schema.description("Content of the Article"))
export type ArticleBody = Schema.Schema.Type<typeof ArticleBody>

export const ArticleTag = Schema.string.pipe(Schema.brand("ArticleTag"), Schema.description("Tag for the Article"))
export type ArticleTag = Schema.Schema.Type<typeof ArticleTag>

export const ArticleTagList = Schema.array(ArticleTag)
export type ArticleTagList = Schema.Schema.Type<typeof ArticleTagList>

export const Article = Schema.struct({
  id: ArticleId,
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

export type Article = Schema.Schema.Type<typeof Article>
