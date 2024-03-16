import type { JwtToken, User } from "@/model"
import { Unauthorized } from "@/services/errors"
import type { Unprocessable } from "@/services/errors"
import { GetCurrentUser } from "@/services/GetCurrentUser"
import { AsyncData, Context, RefAsyncData, RefSubject } from "@typed/core"
import { Effect, Option } from "effect"

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

export const isAuthenticated = Effect.map(CurrentUser, AsyncData.isSuccess)

export const isAuthenticatedGuard = <P>(params: P) =>
  Effect.map(isAuthenticated, (b) => b ? Option.some(params) : Option.none())

export const SaveJwtToken = Context.Fn<(token: JwtToken) => Effect.Effect<void, never>>()("SaveJwtToken")

export const ReadJwtToken = Context.Fn<() => Effect.Effect<Option.Option<JwtToken>, never>>()("ReadJwtToken")

export const getCurrentUser = RefAsyncData.runAsyncData(
  CurrentUser,
  Effect.gen(function*(_) {
    const token = yield* _(ReadJwtToken())
    if (Option.isNone(token)) return yield* _(new Unauthorized())
    return yield* _(GetCurrentUser(token.value))
  })
)
