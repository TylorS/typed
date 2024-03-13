import type { ArticleTagList } from "@/model"
import type { Unprocessable } from "@/services/errors"
import { Fn } from "@typed/context"
import type { Effect } from "effect"

export type GetTagsError = Unprocessable

export const GetTags = Fn<() => Effect.Effect<ArticleTagList, GetTagsError>>()("GetTags")
