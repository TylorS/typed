import { Fn } from "@typed/context"
import * as Schema from "@typed/realworld/lib/Schema"
import type { Article } from "@typed/realworld/model"
import { ArticleSlug } from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export const DeleteArticleInput = Schema.Struct({ slug: ArticleSlug }).pipe(Schema.identifier("DeleteArticleInput"))
export type DeleteArticleInput = Schema.Schema.Type<typeof DeleteArticleInput>

export type DeleteArticleError = Unauthorized | Unprocessable

export const DeleteArticle = Fn<(input: DeleteArticleInput) => Effect.Effect<Article, DeleteArticleError>>()(
  "DeleteArticle"
)
export type DeleteArticle = Fn.Identifier<typeof DeleteArticle>
