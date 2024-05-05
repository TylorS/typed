import { Fn } from "@typed/context"
import type { ArticleSlug, Comment } from "@typed/realworld/model"
import type { Unauthorized, Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export type GetCommentsError = Unprocessable | Unauthorized

export const GetComments = Fn<(slug: ArticleSlug) => Effect.Effect<ReadonlyArray<Comment>, GetCommentsError>>()(
  "GetComments"
)
export type GetComments = Fn.Identifier<typeof GetComments>
