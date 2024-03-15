import * as Api from "@/api"
import * as Ui from "@/ui"
import * as Http from "@effect/platform/HttpServer"
import * as Node from "@typed/core/Node"
import * as Platform from "@typed/core/Platform"
import { Effect } from "effect"

Platform.toHttpRouter(Ui.router, { layout: Ui.layout }).pipe(
  Http.router.mountApp("/api", Api.server),
  Node.listen({ port: 3000, serverDirectory: import.meta.dirname }),
  Effect.provide(Api.Live),
  Node.run
)
