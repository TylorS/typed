/**
 * Storybook v3 renderer.
 * @since 1.0.0
 */

import type { RenderContext } from "@storybook/types"

import * as Fx from "@typed/fx/Fx"
import { getRandomValues } from "@typed/id"
import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import { renderToLayer } from "@typed/template"
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

  const renderable = Fx.switchMapCause(
    storyFn(storyContext),
    (cause) =>
      Fx.mergeFirst(
        Fx.never,
        Fx.fromEffect(onCause(cause))
      )
  )

  const program = renderToLayer(renderable, window, { rootElement }).pipe(
    Layer.provideMerge(Router.server("/")),
    Layer.provideMerge(Navigation.initialMemory({ url: "/" })),
    Layer.provideMerge(getRandomValues),
    Layer.launch,
    Effect.catchAllCause(onCause)
  )

  const fiber = Effect.runFork(program)

  showMain()

  return () => {
    return Effect.runFork(fiber.interruptAsFork(FiberId.none))
  }
}
