import * as NodeSdk from "@effect/opentelemetry/NodeSdk"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import * as Node from "@typed/core/Node"
import { toServerRouter } from "@typed/core/Platform"
import * as Api from "@typed/realworld/api"
import { CurrentUserLive, Live } from "@typed/realworld/api/infrastructure"
import * as Ui from "@typed/realworld/ui"
import { ServerHeaders, ServerResponse, ServerRouter } from "@typed/server"
import { Effect, LogLevel } from "effect"
import sms from "source-map-support"

// Enable source maps for errors
sms.install()

// Convert our UI router to a ServerRouter and provide a layout to construct a full HTML document.
toServerRouter(Ui.router, { layout: Ui.document }).pipe(
  ServerRouter.catchAll((error) =>
    ServerResponse.empty({
      status: 303,
      headers: ServerHeaders.fromInput({
        location: error._tag === "RedirectError" ? error.path.toString() : "/login"
      })
    })
  ),
  // Mount our API
  ServerRouter.mountApp(
    "/api",
    Effect.catchTag(Api.server, "Unauthorized", () => ServerResponse.empty({ status: 401 }))
  ),
  // Provide all resources which change per-request
  Effect.provide(CurrentUserLive),
  // Start the server. Integrates with our Vite plugin to serve client assets using Vite for development and
  // using a static file server, with gzip support, for production.
  Node.listen({ port: 3000, serverDirectory: import.meta.dirname, logLevel: LogLevel.Debug }),
  // Provide all static resources which do not change per-request
  Effect.provide(Live),
  // OpenTelemetry tracing
  Effect.provide(
    NodeSdk.layer(() => ({
      resource: { serviceName: "realworld" },
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: "http://localhost:4318/v1/traces"
        })
      )
    }))
  ),
  // Kick off the application, capturing SIGINT and SIGTERM to gracefully shutdown the server
  // as well as respond to Vite's HMR requests to clean up resources when change occur during development.
  Node.run
)
