import type { JwtToken, User } from "@/model"
import { Unauthorized } from "@/services/errors"
import type { Unprocessable } from "@/services/errors"
import { GetCurrentUser } from "@/services/GetCurrentUser"
import { AsyncData, Context, RefAsyncData, RefSubject } from "@typed/core"
import { Effect, Option, Unify } from "effect"

export const CurrentUser = RefSubject.tagged<AsyncData.AsyncData<User, Unauthorized | Unprocessable>>()("CurrentUser")
export type CurrentUser = RefSubject.Identifier<typeof CurrentUser>

export const getCurrentJwtToken = CurrentUser.pipe(
  RefAsyncData.awaitLoadingOrRefreshing,
  Effect.flatMap(Unify.unify((data) => {
    switch (data._tag) {
      case "NoData":
        return ReadJwtToken().pipe(Effect.flatten, Effect.catchAll(() => new Unauthorized()))
      case "Failure":
        return Effect.fail(new Unauthorized())
      default:
        return Effect.succeed(data.value.token)
    }
  }))
)

export const isAuthenticated = RefSubject.map(CurrentUser, AsyncData.isSuccess)

export const isAuthenticatedGuard = <P>(params: P) =>
  Effect.map(isAuthenticated, (b) => b ? Option.some(params) : Option.none())

export const SaveJwtToken = Context.Fn<(token: JwtToken) => Effect.Effect<void>>()("SaveJwtToken")

export const ReadJwtToken = Context.Fn<() => Effect.Effect<Option.Option<JwtToken>>>()("ReadJwtToken")

export const RemoveJwtToken = Context.Fn<() => Effect.Effect<void>>()("RemoveJwtToken")

export const getCurrentUserData = RefAsyncData.runAsyncData(
  CurrentUser,
  Effect.tapBoth(GetCurrentUser(), {
    onFailure: () => RemoveJwtToken(),
    onSuccess: (user) => SaveJwtToken(user.token)
  })
)

export const getOptionalCurrentUser = Effect.map(getCurrentUserData, AsyncData.toOption)
