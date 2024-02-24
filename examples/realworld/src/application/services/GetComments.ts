import * as Context from "@typed/context"
import type { Effect } from "effect/Effect"
import type { ArticleSlug, Comment } from "../../domain"

export const GetComments = Context.Fn<(slug: ArticleSlug) => Effect<ReadonlyArray<Comment>>>()((_) =>
  class GetComments extends _("articles/GetComments") {}
)

export type GetComments = Context.Fn.Identifier<typeof GetComments>
