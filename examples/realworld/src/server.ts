import * as Node from "@typed/core/Node"
import * as Api from "@typed/realworld/api"
import { CurrentUserLive, Live } from "@typed/realworld/api/infrastructure"
import { ServerRouter } from "@typed/server"
import { Effect, LogLevel } from "effect"
import sms from "source-map-support"
import { UiServer } from "./ui/server"

// Enable source maps for errors
sms.install()

// Our server is a composition of our API and UI servers
UiServer.pipe(
  // Mount our API
  ServerRouter.mountApp("/api", Api.server),
  // Provide all resources which change per-request
  Effect.provide(CurrentUserLive),
  // Start the server. Integrates with our Vite plugin to serve client assets using Vite for development and
  // using a static file server, with gzip support, for production.
  Node.listen({ port: 3000, serverDirectory: import.meta.dirname, logLevel: LogLevel.Debug }),
  // Provide all static resources which do not change per-request
  Effect.provide(Live),
  // Kick off the application, capturing SIGINT and SIGTERM to gracefully shutdown the server
  // as well as respond to Vite's HMR requests to clean up resources when change occur during development.
  Node.run
)
