import * as Api from "@/api"
import { CurrentJwt, Live } from "@/api/infrastructure"
import { JwtToken } from "@/model"
import { CurrentUser, Users } from "@/services"
import * as Ui from "@/ui"
import type { HttpServer } from "@effect/platform"
import * as Http from "@effect/platform/HttpServer"
import { AsyncData, RefSubject } from "@typed/core"
import * as Node from "@typed/core/Node"
import { toHttpRouter } from "@typed/core/Platform"
import { Effect, LogLevel, Option } from "effect"

const disposable = toHttpRouter(Ui.router, { layout: Ui.layout }).pipe(
  Http.router.mount("/api", Api.server),
  withCurrentUserFromHeaders,
  Effect.provide(Live),
  Node.listen({ port: 3000, serverDirectory: import.meta.dirname, logLevel: LogLevel.Debug }),
  Node.run
)

if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.dispose(disposable[Symbol.dispose])
}

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
        // CurrentUser is the client representation of the current user
        CurrentUser.tag.provideEffect(RefSubject.of<RefSubject.Success<typeof CurrentUser>>(AsyncData.noData()))
      )
    }

    // Otherwise, provide the app with the current user and token
    return yield* _(
      app,
      CurrentUser.tag.provideEffect(
        // A RefSubject is lazily-instantiated, so this Service will not be called unless the app needs it
        RefSubject.make(Users.current().pipe(Effect.exit, Effect.map(AsyncData.fromExit)))
      ),
      // CurrentJwt is the server representation of the current user
      CurrentJwt.provide(token.value)
    )
  })
}
