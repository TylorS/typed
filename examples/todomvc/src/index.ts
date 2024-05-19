import { fromWindow } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import { renderToLayer } from "@typed/template"
import { Effect, Layer } from "effect"
import { Live } from "./infrastructure"
import { TodoApp } from "./presentation"

const environment = Live.pipe(
  Layer.provideMerge(Storage.layer(localStorage)),
  Layer.provideMerge(fromWindow(window))
)

TodoApp.pipe(
  renderToLayer,
  Layer.provide(environment),
  Layer.launch,
  Effect.runFork
)
