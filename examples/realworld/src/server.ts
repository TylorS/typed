import * as Api from "@/api"
import { CurrentJwt } from "@/api/common/infrastructure/CurrentJwt"
import { Live as ApiLive } from "@/api/infrastructure"
import { JwtToken } from "@/model"
import { GetCurrentUser } from "@/services/GetCurrentUser"
import * as Ui from "@/ui"
import { CurrentUser } from "@/ui/services/CurrentUser"
import type { HttpServer } from "@effect/platform"
import { NodeContext } from "@effect/platform-node"
import * as Http from "@effect/platform/HttpServer"
import { AsyncData, RefSubject } from "@typed/core"
import * as Node from "@typed/core/Node"
import * as Platform from "@typed/core/Platform"
import { Effect, LogLevel, Option } from "effect"
import { NodeSwaggerFiles } from "effect-http-node"

const server = Platform.toHttpRouter(Ui.router, { layout: Ui.layout }).pipe(
  Http.router.provideServiceEffect(CurrentUser.tag, Effect.suspend(() => getCurrentUserFromToken)),
  Http.router.mount("/api", Api.server),
  provideCurrentJwt
)

server.pipe(
  Node.listen({ port: 3000, serverDirectory: import.meta.dirname, logLevel: LogLevel.Debug }),
  Effect.provide(NodeSwaggerFiles.SwaggerFilesLive),
  Effect.provide(NodeContext.layer),
  Effect.provide(ApiLive),
  Node.run
)

function provideCurrentJwt<R, E>(app: HttpServer.router.Router<R, E>) {
  return Effect.gen(function*(_) {
    const token = yield* _(getCurrentJwtFromHeaders)

    if (Option.isNone(token)) {
      return yield* _(app)
    }

    return yield* _(app, CurrentJwt.provide(token.value))
  })
}

const getCurrentUserFromToken = Effect.gen(function*(_) {
  const token = yield* _(getCurrentJwtFromHeaders)

  if (Option.isNone(token)) {
    return yield* _(RefSubject.of<RefSubject.Success<typeof CurrentUser>>(AsyncData.noData()))
  }
  const user = yield* _(GetCurrentUser(), CurrentJwt.provide(token.value), Effect.exit)

  return yield* _(
    RefSubject.of<RefSubject.Success<typeof CurrentUser>>(AsyncData.fromExit(user))
  )
})

const getCurrentJwtFromHeaders = Effect.gen(function*(_) {
  const { headers } = yield* _(Http.request.ServerRequest)
  const authorization = Http.headers.get(headers, "authorization")

  if (Option.isNone(authorization)) {
    return Option.none()
  }
  const token = JwtToken(authorization.value.split(" ")[1])

  return Option.some(token)
})
