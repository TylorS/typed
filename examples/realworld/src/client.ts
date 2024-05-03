import { hydrateFromWindow, hydrateToLayer } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import "./styles.css"

import { Effect, Layer } from "effect"
import * as Ui from "./ui"

Ui.main.pipe(
  hydrateToLayer,
  Layer.launch,
  Effect.provide(Ui.Live),
  Effect.provide(Storage.layer(localStorage)),
  Effect.provide(hydrateFromWindow(window, { rootElement: document.getElementById("app")! })),
  Effect.scoped,
  Effect.runFork
)
