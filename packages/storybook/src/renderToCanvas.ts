/**
 * Storybook v3 renderer.
 * @since 1.0.0
 */

import type { RenderContext } from "@storybook/types"
import * as Fx from "@typed/fx/Fx"
import { getRandomValues } from "@typed/id/GetRandomValues"
import { initialMemory } from "@typed/navigation/Layer"
import { server } from "@typed/router/CurrentRoute"
import { renderLayer, renderToLayer } from "@typed/template/Render"
import * as RenderQueue from "@typed/template/RenderQueue"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as FiberId from "effect/FiberId"
import * as Layer from "effect/Layer"
import type { TypedRenderer } from "./types.js"

/**
 * Storybook v3 renderer.
 * @since 1.0.0
 */
export async function renderToCanvas(
  { showError, showMain, storyContext, storyFn }: RenderContext<TypedRenderer>,
  rootElement: TypedRenderer["canvasElement"]
) {
  const onCause = (cause: Cause.Cause<unknown>) =>
    Effect.sync(() => {
      showError({ title: `Render Failure`, description: Cause.pretty(cause) })
    })

  const renderable = Fx.switchMapCause(
    storyFn(storyContext),
    (cause) => Fx.mergeFirst(Fx.never, Fx.fromEffect(onCause(cause)))
  )

  const program = renderToLayer(renderable).pipe(
    Layer.provideMerge(server("/")),
    Layer.provideMerge(initialMemory({ url: "/" })),
    Layer.provideMerge(renderLayer(window, { rootElement })),
    Layer.provide(RenderQueue.mixed()),
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
