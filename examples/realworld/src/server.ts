import * as Api from "@/api"
import { Live } from "@/api/infrastructure"
import * as Ui from "@/ui"
import * as Http from "@effect/platform/HttpServer"
import * as Node from "@typed/core/Node"
import { toServerRouter } from "@typed/core/Platform"
import { ServerRouter } from "@typed/server"
import { Effect, LogLevel } from "effect"
import sms from "source-map-support"

sms.install()

const uiRouter = ServerRouter.catchAll(
  toServerRouter(Ui.router, { layout: Ui.document }),
  (_) =>
    Http.response.empty({
      status: 303,
      headers: Http.headers.fromInput({
        location: _._tag === "RedirectError" ? _.path.toString() : "/login"
      })
    })
)

const apiServer = Effect.catchTag(Api.server, "Unauthorized", () => Http.response.empty({ status: 401 }))

uiRouter.pipe(
  ServerRouter.mountApp("/api", apiServer),
  Effect.provide(Live),
  Node.listen({ port: 3000, serverDirectory: import.meta.dirname, logLevel: LogLevel.Debug }),
  Node.run
)
