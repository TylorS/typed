import { hydrateToLayer, type RenderEvent } from "@typed/template"
import { Effect, Layer } from "effect"
import type { Scope } from "effect/Scope"
import type { CoreDomServices } from "./CoreServices.js"
import { fromWindow } from "./CoreServices.js"
import type { Fx } from "./Fx.js"

export const run = <A extends RenderEvent | null, E>(App: Fx<A, E, CoreDomServices | Scope>): Disposable => {
  const fiber = App.pipe(
    hydrateToLayer,
    Layer.provide(fromWindow(window)),
    Layer.launch,
    Effect.scoped,
    Effect.runFork
  )

  const onDispose = () => fiber.unsafeInterruptAsFork(fiber.id())

  // Clean up if HMR is enabled
  // TODO: We should see if there's a logical way to keep state around
  if (import.meta.hot) {
    import.meta.hot.dispose(onDispose)
  }

  // Best effort to clean up
  window.addEventListener("beforeunload", onDispose, { once: true })
  window.addEventListener("unload", onDispose, { once: true })

  return {
    [Symbol.dispose]: onDispose
  }
}
