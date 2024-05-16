import { Arbitrary, Schema } from "@effect/schema"
import { nanoId } from "@typed/id/Schema"
import { Profile } from "./Profile.js"

export const ArticleId = nanoId.pipe(
  Schema.brand("ArticleId"),
  Schema.description("Unique identifier for the Article")
)

export const ArticleSlug = Schema.String.pipe(
  Schema.brand("ArticleSlug"),
  Schema.description("Slug for Article generated from Article.title")
)
export type ArticleSlug = Schema.Schema.Type<typeof ArticleSlug>

export const ArticleTitle = Schema.String.pipe(Schema.brand("ArticleTitle"), Schema.description("Title of the Article"))
export type ArticleTitle = Schema.Schema.Type<typeof ArticleTitle>

export const ArticleDescription = Schema.String.pipe(
  Schema.brand("ArticleDescription"),
  Schema.description("Description of the Article")
)
export type ArticleDescription = Schema.Schema.Type<typeof ArticleDescription>

export const ArticleBody = Schema.String.pipe(
  Schema.minLength(1),
  Schema.brand("ArticleBody"),
  Schema.description("Content of the Article")
)
export type ArticleBody = Schema.Schema.Type<typeof ArticleBody>

export const ArticleTag = Schema.String.pipe(
  Schema.brand("ArticleTag"),
  Schema.description("Tag for the Article")
)
export type ArticleTag = Schema.Schema.Type<typeof ArticleTag>

export const ArticleTagList = Schema.Array(ArticleTag)
export type ArticleTagList = Schema.Schema.Type<typeof ArticleTagList>

export const Article = Schema.Struct({
  id: ArticleId,
  slug: ArticleSlug,
  title: ArticleTitle.pipe(
    Arbitrary.arbitrary(() => (fc) =>
      fc.base64String({ minLength: 1, maxLength: 10 }).map((title) => ArticleTitle.make(title.replace(/\s+/g, " ")))
    )
  ),
  description: ArticleDescription.pipe(
    Arbitrary.arbitrary(() => (fc) =>
      fc.base64String({ minLength: 1, maxLength: 100 }).map((description) =>
        ArticleDescription.make(description.replace(/\s+/g, " "))
      )
    )
  ),
  body: ArticleBody.pipe(
    Arbitrary.arbitrary(() => (fc) =>
      fc.base64String({ minLength: 1, maxLength: 1000 }).map((body) => ArticleBody.make(body.replace(/\s+/g, " ")))
    )
  ),
  tagList: ArticleTagList.pipe(
    Arbitrary.arbitrary(() => (fc) =>
      fc.array(fc.base64String({ minLength: 2, maxLength: 10 }), { minLength: 1, maxLength: 5 }).map((
        tags
      ): ArticleTagList => tags.map((_) => ArticleTag.make(_)))
    )
  ),
  author: Profile,
  favorited: Schema.Boolean,
  favoritesCount: Schema.Number,
  createdAt: Schema.Date,
  updatedAt: Schema.Date
}).pipe(
  Schema.identifier("Article")
)

export interface Article extends Schema.Schema.Type<typeof Article> {}
