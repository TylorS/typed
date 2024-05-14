import * as NodeSdk from "@effect/opentelemetry/NodeSdk"
import * as Http from "@effect/platform/HttpServer"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import * as Node from "@typed/core/Node"
import { toServerRouter } from "@typed/core/Platform"
import * as Api from "@typed/realworld/api"
import { Live } from "@typed/realworld/api/infrastructure"
import { CurrentUserLive } from "@typed/realworld/api/users/infrastructure"
import * as Ui from "@typed/realworld/ui"
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
  Effect.provide(CurrentUserLive),
  Node.listen({ port: 3000, serverDirectory: import.meta.dirname, logLevel: LogLevel.Debug }),
  Effect.provide(NodeSdk.layer(() => ({
    resource: { serviceName: "realworld" },
    spanProcessor: new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: "http://localhost:4318/v1/traces"
      })
    )
  }))),
  // Provide all static resources which do not change per-request
  Effect.provide(Live),
  Node.run
)
