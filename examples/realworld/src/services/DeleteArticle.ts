import type { Article } from "@/domain"
import { ArticleSlug } from "@/domain"
import * as Schema from "@/lib/Schema"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const DeleteArticleInput = Schema.struct({ slug: ArticleSlug })
export type DeleteArticleInput = Schema.Schema.To<typeof DeleteArticleInput>

export const DeleteArticle = Fn<(input: DeleteArticleInput) => Effect.Effect<Article>>()("DeleteArticle")
export type DeleteArticle = Fn.Identifier<typeof DeleteArticle>
