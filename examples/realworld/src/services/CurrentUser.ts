import type { JwtToken, User } from "@/model"
import { Unauthorized } from "@/services/errors"
import type { Unprocessable } from "@/services/errors"
import { GetCurrentUser } from "@/services/GetCurrentUser"
import type { Route } from "@typed/core"
import { AsyncData, Context, Fx, RefAsyncData, RefSubject } from "@typed/core"
import { RedirectError } from "@typed/navigation"
import { RouteGuard } from "@typed/router"
import type { Option } from "effect"
import { Effect, Unify } from "effect"

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

export const isAuthenticated = CurrentUser.pipe(
  Fx.dropWhile(AsyncData.isLoadingOrRefreshing),
  Fx.map(AsyncData.isSuccess),
  Fx.takeOneIfDomEnvironment
)

export const isAuthenticatedGuard = <R extends Route.Route.Any>(route: R) =>
  RouteGuard.flatMap(RouteGuard.fromRoute(route), (params) =>
    Effect.flatMap(
      RefAsyncData.awaitLoadingOrRefreshing(CurrentUser),
      (user) =>
        AsyncData.isSuccess(user)
          ? Effect.succeedSome(params)
          : new RedirectError({ path: "/login" })
    ))

export const SaveJwtToken = Context.Fn<(token: JwtToken) => Effect.Effect<void>>()("SaveJwtToken")

export const ReadJwtToken = Context.Fn<() => Effect.Effect<Option.Option<JwtToken>>>()("ReadJwtToken")

export const RemoveJwtToken = Context.Fn<() => Effect.Effect<void>>()("RemoveJwtToken")

export const getCurrentUserData = RefAsyncData.runIfNoData(CurrentUser, GetCurrentUser())

export const getOptionalCurrentUser = Effect.map(getCurrentUserData, AsyncData.toOption)
