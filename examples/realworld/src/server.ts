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

toHttpRouter(Ui.router, { layout: Ui.document }).pipe(
  Http.router.mount("/api", Api.server),
  Http.router.catchAll(
    () => Http.response.empty({ status: 303, headers: Http.headers.unsafeFromRecord({ location: "/login" }) })
  ),
  withCurrentUserFromHeaders,
  Effect.provide(Live),
  Node.listen({ port: 3000, serverDirectory: import.meta.dirname, logLevel: LogLevel.Debug }),
  Node.run
)

function withCurrentUserFromHeaders<R, E>(app: HttpServer.router.Router<R, E>) {
  return Effect.gen(function*(_) {
    const { headers } = yield* _(Http.request.ServerRequest)
    const token = Http.headers.get(headers, "authorization").pipe(
      Option.map((authorization) => JwtToken(authorization.split(" ")[1])),
      Option.orElse(() =>
        Http.headers.get(headers, "cookie").pipe(
          Option.flatMap((cookie) => findJwtTokenInCookies(cookie.split("; "), "conduit-creds"))
        )
      )
    )

    // If no token is present, provide the app with no user or token
    if (Option.isNone(token)) {
      const user = yield* _(RefSubject.of<RefSubject.Success<typeof CurrentUser>>(AsyncData.noData()))

      return yield* _(
        app,
        // CurrentUser is the client representation of the current user
        // We add take(1) to ensure that the templates will finish emitting.
        CurrentUser.tag.provide(RefSubject.take(user, 1))
      )
    }

    const user = yield* _(
      Users.current(),
      Effect.exit,
      Effect.map(AsyncData.fromExit),
      Effect.flatMap(RefSubject.of),
      // CurrentJwt is the server representation of the current user
      CurrentJwt.provide(token.value)
    )

    // Otherwise, provide the app with the current user and token
    return yield* _(
      app,
      CurrentUser.tag.provide(RefSubject.take(user, 1)),
      CurrentJwt.provide(token.value)
    )
  })
}

function findJwtTokenInCookies(cookies: Array<string>, key: string) {
  return Option.map(
    Option.fromNullable(cookies.find((cookie) => cookie.startsWith(`${key}=`))?.split("=")[1]),
    JwtToken
  )
}
