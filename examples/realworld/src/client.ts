import "./styles.css"

import { hydrateToLayer } from "@typed/core"
import { Effect, Layer } from "effect"
import * as Ui from "./ui"

Ui.main.pipe(
  hydrateToLayer,
  Layer.launch,
  Effect.provide(Ui.Live),
  Effect.scoped,
  Effect.runFork
)
