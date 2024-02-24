import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { ArticleTag } from "../../domain"

export const GetTags = Context.Fn<() => Effect<ReadonlyArray<ArticleTag>>>()((_) =>
  class GetTags extends _("articles/GetTags") {}
)

export type GetTags = Context.Fn.Identifier<typeof GetTags>
