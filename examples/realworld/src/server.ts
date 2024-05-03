import * as Api from "@/api"
import { Live } from "@/api/infrastructure"
import { CurrentUserLive } from "@/api/users/infrastructure"
import * as Ui from "@/ui"
import * as Http from "@effect/platform/HttpServer"
import * as Node from "@typed/core/Node"
import { toServerRouter } from "@typed/core/Platform"
import { ServerResponse, ServerRouter } from "@typed/server"
import { Effect, LogLevel } from "effect"
import sms from "source-map-support"

sms.install()

toServerRouter(Ui.router, { layout: Ui.document }).pipe(
  ServerRouter.catchAll(
    (_) =>
      ServerResponse.empty({
        status: 303,
        headers: Http.headers.fromInput({
          location: _._tag === "RedirectError" ? _.path.toString() : "/login"
        })
      })
  ),
  ServerRouter.mountApp(
    "/api",
    Effect.catchTag(Api.server, "Unauthorized", () => ServerResponse.empty({ status: 401 }))
  ),
  // CurrentUserLive depends on ServerRequest provided by Node.listen
  Effect.provide(CurrentUserLive),
  Node.listen({ port: 3000, serverDirectory: import.meta.dirname, logLevel: LogLevel.Debug }),
  // Provide all static resources which do not change per-request
  Effect.provide(Live),
  Node.run
)
