import type { ArticleSlug, Comment } from "@realworld/model"
import type { Unauthorized, Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export type GetCommentsError = Unprocessable | Unauthorized

export const GetComments = Fn<(slug: ArticleSlug) => Effect.Effect<ReadonlyArray<Comment>, GetCommentsError>>()(
  "GetComments"
)
export type GetComments = Fn.Identifier<typeof GetComments>
