import * as Api from "@/api"
import { CurrentJwt } from "@/api/common/infrastructure/CurrentJwt"
import { Live as ApiLive } from "@/api/infrastructure"
import { JwtToken } from "@/model"
import { GetCurrentUser } from "@/services/GetCurrentUser"
import * as Ui from "@/ui"
import { CurrentUser } from "@/ui/services/CurrentUser"
import type { HttpServer } from "@effect/platform"
import * as Http from "@effect/platform/HttpServer"
import { AsyncData, RefSubject } from "@typed/core"
import * as Node from "@typed/core/Node"
import * as Platform from "@typed/core/Platform"
import { Effect, LogLevel, Option } from "effect"

Platform.toHttpRouter(Ui.router, { layout: Ui.layout }).pipe(
  Http.router.mount("/api", Api.server),
  withCurrentUserFromHeaders,
  Effect.provide(ApiLive),
  Node.listen({ port: 3000, serverDirectory: import.meta.dirname, logLevel: LogLevel.Debug }),
  Node.hot(import.meta.hot)
)

function withCurrentUserFromHeaders<R, E>(app: HttpServer.router.Router<R, E>) {
  return Effect.gen(function*(_) {
    const { headers } = yield* _(Http.request.ServerRequest)
    const token = Http.headers.get(headers, "authorization").pipe(
      Option.map((authorization) => JwtToken(authorization.split(" ")[1]))
    )

    // If no token is present, provide the app with no user or token
    if (Option.isNone(token)) {
      return yield* _(
        app,
        CurrentUser.tag.provideEffect(RefSubject.of<RefSubject.Success<typeof CurrentUser>>(AsyncData.noData()))
      )
    }

    // Otherwise, provide the app with the current user and token
    return yield* _(
      app,
      CurrentUser.tag.provideEffect(RefSubject.of(AsyncData.fromExit(yield* _(Effect.exit(GetCurrentUser()))))),
      CurrentJwt.provide(token.value)
    )
  })
}
