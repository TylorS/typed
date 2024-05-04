import type { ArticleTagList } from "@realworld/model"
import type { Unprocessable } from "@realworld/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export type GetTagsError = Unprocessable

export const GetTags = Fn<() => Effect.Effect<ArticleTagList, GetTagsError>>()("GetTags")

export type GetTags = Fn.Identifier<typeof GetTags>
