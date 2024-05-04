import * as Schema from "@realworld/lib/Schema"
import type { Article } from "@realworld/model"
import { ArticleSlug } from "@realworld/model"
import type { Unauthorized, Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const DeleteArticleInput = Schema.Struct({ slug: ArticleSlug }).pipe(Schema.identifier("DeleteArticleInput"))
export type DeleteArticleInput = Schema.Schema.Type<typeof DeleteArticleInput>

export type DeleteArticleError = Unauthorized | Unprocessable

export const DeleteArticle = Fn<(input: DeleteArticleInput) => Effect.Effect<Article, DeleteArticleError>>()(
  "DeleteArticle"
)
export type DeleteArticle = Fn.Identifier<typeof DeleteArticle>
