import * as Api from "@/api"
import { CurrentJwt, Live } from "@/api/infrastructure"
import { JwtToken } from "@/model"
import { CurrentUser, Users } from "@/services"
import * as Ui from "@/ui"
import type { HttpServer } from "@effect/platform"
import * as Http from "@effect/platform/HttpServer"
import { AsyncData } from "@typed/core"
import * as Node from "@typed/core/Node"
import { toHttpRouter } from "@typed/core/Platform"
import { Effect, LogLevel, Option } from "effect"
import sms from "source-map-support"

sms.install()

const uiRouter = Http.router.catchAll(
  toHttpRouter(Ui.router, { layout: Ui.document }),
  (_) =>
    Http.response.empty({
      status: 303,
      headers: Http.headers.unsafeFromRecord({
        location: _._tag === "RedirectError" ? _.path.toString() : "/login"
      })
    })
)

Http.router.empty.pipe(
  Http.router.mountApp("/api", Api.server),
  Http.router.mountApp("/", uiRouter),
  Http.router.catchTag("Unauthorized", (_) => Http.response.empty({ status: 401 })),
  withCurrentUserFromHeaders,
  Node.listen({ port: 3000, serverDirectory: import.meta.dirname, logLevel: LogLevel.Debug }),
  Effect.provide(Live),
  Node.run
)

function withCurrentUserFromHeaders<E, R>(app: HttpServer.router.Router<E, R>) {
  return Effect.gen(function*(_) {
    const { headers } = yield* _(Http.request.ServerRequest)
    const token = Http.headers.get(headers, "authorization").pipe(
      Option.map((authorization) => JwtToken(authorization.split(" ")[1])),
      Option.orElse(() =>
        Http.headers.get(headers, "cookies").pipe(
          Option.map(Http.cookies.parseHeader),
          Option.flatMap((_) => Option.fromNullable(_["conduit-token"])),
          Option.map(JwtToken)
        )
      )
    )
    // If no token is present, provide the app with no user or token
    if (Option.isNone(token)) {
      return yield* _(
        app,
        // CurrentUser is the client representation of the current user
        Effect.provide(CurrentUser.make(Effect.succeed(AsyncData.noData()), { take: 1 }))
      )
    }

    // Otherwise, provide the app with the current user and token
    return yield* _(
      app,
      Effect.provide(CurrentUser.make(Users.current().pipe(Effect.exit, Effect.map(AsyncData.fromExit)), { take: 1 })),
      // CurrentJwt is the server representation of the current token
      CurrentJwt.provide(token.value)
    )
  })
}
