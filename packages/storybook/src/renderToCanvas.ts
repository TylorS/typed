/**
 * Storybook v3 renderer.
 * @since 1.0.0
 */

import type { RenderContext } from "@storybook/types"

import { domServices } from "@typed/dom/DomServices"
import { GlobalThis } from "@typed/dom/GlobalThis"
import { Window } from "@typed/dom/Window"
import { CurrentEnvironment } from "@typed/environment"
import * as Fx from "@typed/fx/Fx"
import { getRandomValues } from "@typed/id"
import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import { RenderContext as TemplateContext, renderLayer } from "@typed/template"
import { Cause, Effect, FiberId, Layer } from "effect"
import type { TypedRenderer } from "./types"

/**
 * Storybook v3 renderer.
 * @since 1.0.0
 */
export async function renderToCanvas(
  {
    showError,
    showMain,
    storyContext,
    storyFn
  }: RenderContext<TypedRenderer>,
  rootElement: TypedRenderer["canvasElement"]
) {
  const onCause = (cause: Cause.Cause<unknown>) =>
    Effect.sync(() => {
      showError({ title: `Cause`, description: Cause.pretty(cause) })
    })

  const program = storyFn(storyContext).pipe(
    Fx.switchMapCause(
      (cause) =>
        Fx.mergeFirst(
          Fx.never,
          Fx.fromEffect(onCause(cause))
        )
    ),
    renderLayer,
    Layer.provideMerge(Router.server("/")),
    Layer.provideMerge(Navigation.initialMemory({ url: "/" })),
    Layer.provideMerge(
      TemplateContext.RenderContext.scoped(
        Effect.scopeWith((scope) => Effect.sync(() => TemplateContext.unsafeMake({ environment: "dom", scope }, true)))
      )
    ),
    Layer.provideMerge(domServices({ rootElement })),
    Layer.provideMerge(Window.layer(window)),
    Layer.provideMerge(GlobalThis.layer(window)),
    Layer.provideMerge(getRandomValues),
    Layer.provideMerge(CurrentEnvironment.layer("dom")),
    Layer.launch,
    Effect.catchAllCause(onCause)
  )

  const fiber = Effect.runFork(program)

  showMain()

  return () => {
    console.log("interrupting")
    return Effect.runFork(fiber.interruptAsFork(FiberId.none))
  }
}
