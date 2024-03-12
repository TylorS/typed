import { ArticleSlug } from "@/model"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"
import * as Schema from "lib/Schema"

export const DeleteArticleInput = Schema.struct({ slug: ArticleSlug }).pipe(Schema.identifier("DeleteArticleInput"))
export type DeleteArticleInput = Schema.Schema.To<typeof DeleteArticleInput>

export type DeleteArticleError = Unauthorized | Unprocessable

export const DeleteArticle = Fn<(input: DeleteArticleInput) => Effect.Effect<void, DeleteArticleError>>()(
  "DeleteArticle"
)
export type DeleteArticle = Fn.Identifier<typeof DeleteArticle>
