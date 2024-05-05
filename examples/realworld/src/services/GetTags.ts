import { Fn } from "@typed/context"
import type { ArticleTagList } from "@typed/realworld/model"
import type { Unprocessable } from "@typed/realworld/services/errors"
import type { Effect } from "effect"

export type GetTagsError = Unprocessable

export const GetTags = Fn<() => Effect.Effect<ArticleTagList, GetTagsError>>()("GetTags")

export type GetTags = Fn.Identifier<typeof GetTags>
