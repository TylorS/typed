import { Storage } from "@typed/dom/Storage"
import * as Fx from "@typed/fx/Fx"
import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import { RenderQueue, renderToLayer } from "@typed/template"
import { Effect, Layer } from "effect"
import { Live } from "./infrastructure"
import { TodoApp } from "./presentation"

const environment = Live.pipe(
  Layer.provideMerge(Storage.layer(localStorage)),
  Layer.provideMerge(Router.browser),
  Layer.provideMerge(Navigation.fromWindow)
)

TodoApp.pipe(
  Fx.provide(environment),
  renderToLayer,
  /* Synchronous */
  // Layer.provide(RenderQueue.sync),

  /* queueMicrotask */
  // Layer.provide(RenderQueue.microtask),

  /* requestAnimationFrame */
  // Layer.provide(RenderQueue.raf),

  /* requestIdleCallback */
  // Layer.provide(RenderQueue.idle({ timeout: 2000 })),

  /* All of the above, based on priority, defaults to requestAnimationFrame (priority:10) */
  Layer.provide(RenderQueue.mixed({ timeout: 2000 })),
  Layer.launch,
  /* RenderQueue.usingCurrentPriority can be utilized to change the default priority */

  // RenderQueue.usingCurrentPriority(RenderQueue.Priority.Sync), // -1
  // RenderQueue.usingCurrentPriority(RenderQueue.Priority.MicroTask(/[0-9]/)), // 0-9
  // RenderQueue.usingCurrentPriority(RenderQueue.Priority.Raf(/[0-9]/)), // 10-19
  // RenderQueue.usingCurrentPriority(RenderQueue.Priority.Idle(/[0-9)]/)), // 20+
  Effect.runFork
)
