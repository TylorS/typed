import { hydrateFromWindow, hydrateToLayer } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import "./styles.css"

import { Effect, Layer } from "effect"
import * as Ui from "./ui"

Ui.main.pipe(
  hydrateToLayer,
  Layer.provide(Ui.Live),
  Layer.provide(Storage.layer(localStorage)),
  Layer.provide(hydrateFromWindow(window, { rootElement: document.getElementById("app")! })),
  Layer.launch,
  Effect.scoped,
  Effect.runFork
)
