import { router } from "@/client/router"
import { homeRoute } from "@/client/routes"
import { fromWindow } from "@typed/core"
import { hydrateToLayer } from "@typed/template"
import { Effect, Layer } from "effect"
import { ClientLive } from "./client/infrastructure"

hydrateToLayer(router.redirect(homeRoute)).pipe(
  Layer.provide(ClientLive),
  Layer.provide(fromWindow(window, { rootElement: document.getElementById("app")! })),
  Layer.launch,
  Effect.runFork
)
