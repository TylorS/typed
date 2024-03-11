import type { User } from "@/model"
import { Unauthorized } from "@/services/errors"
import type { Unprocessable } from "@/services/errors"
import type { AsyncData } from "@typed/core"
import { RefAsyncData, RefSubject } from "@typed/core"
import { Effect } from "effect"

export const CurrentUser = RefSubject.tagged<AsyncData.AsyncData<User, Unauthorized | Unprocessable>>()("CurrentUser")
export type CurrentUser = RefSubject.Identifier<typeof CurrentUser>

export const getCurrentJwtToken = CurrentUser.pipe(
  RefAsyncData.awaitLoadingOrRefreshing,
  Effect.flatMap((data) => {
    switch (data._tag) {
      case "NoData":
      case "Failure":
        return Effect.fail(new Unauthorized())
      default:
        return Effect.succeed(data.value.token)
    }
  })
)
