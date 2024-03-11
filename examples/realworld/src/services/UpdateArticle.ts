import type { Article } from "@/domain"
import * as Schema from "@/lib/Schema"
import { CreateArticleInput } from "@/services/CreateArticle"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export const UpdateArticleInput = Schema.partial(CreateArticleInput)
export type UpdateArticleInput = Schema.Schema.To<typeof UpdateArticleInput>

export const UpdateArticle = Fn<(input: UpdateArticleInput) => Effect.Effect<Article>>()("UpdateArticle")
export type UpdateArticle = Fn.Identifier<typeof UpdateArticle>
