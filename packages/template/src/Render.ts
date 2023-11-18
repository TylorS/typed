import * as Context from "@typed/context"
import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import { attachRoot, renderTemplate } from "@typed/template/internal/render"
import { RenderContext } from "@typed/template/RenderContext"
import { type RenderEvent } from "@typed/template/RenderEvent"
import { RenderTemplate } from "@typed/template/RenderTemplate"
import { type Rendered } from "@typed/wire"
import * as Effect from "effect/Effect"

export type ToRendered<T extends RenderEvent | null> = T extends null ? Rendered | null : Rendered

export function render<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<R, E, T>
): Fx.Fx<Exclude<R, RenderTemplate> | Document | RenderContext | RootElement, E, ToRendered<T>> {
  return Fx.fromFxEffect(Effect.contextWith((context) => {
    const [document, ctx, { rootElement }] = Context.getMany(context, Document, RenderContext, RootElement)

    return Fx.provideService(
      Fx.mapEffect(rendered, (what) => attachRoot(ctx.renderCache, rootElement, what)),
      RenderTemplate,
      renderTemplate(document, ctx)
    )
  }))
}

export function renderLayer<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<R, E, T>
) {
  return Fx.drainLayer(Fx.switchMapCause(render(rendered), Effect.logError))
}
