import { Effect } from "effect";
import { Fx } from "@typed/fx";
import type { RenderEvent, RenderTemplate } from "../../index.js";
import {
  HtmlRenderTemplate,
  renderToHtml,
  renderToHtmlString,
  StaticHtmlRenderTemplate,
} from "../../index.js";

export function getStaticHtml<E, R>(
  renderable: Fx.Fx<RenderEvent, E, R>,
): Effect.Effect<string, E, Exclude<R, RenderTemplate>> {
  return renderToHtmlString(renderable).pipe(Effect.provide(StaticHtmlRenderTemplate));
}

export function getInteractiveHtml<E, R>(
  renderable: Fx.Fx<RenderEvent, E, R>,
): Effect.Effect<string, E, Exclude<R, RenderTemplate>> {
  return renderToHtmlString(renderable).pipe(Effect.provide(HtmlRenderTemplate));
}

export function getHtmlRenderEvents<E, R>(
  renderable: Fx.Fx<RenderEvent, E, R>,
): Effect.Effect<ReadonlyArray<string>, E, Exclude<R, RenderTemplate>> {
  return renderable.pipe(renderToHtml, Fx.collectAll, Effect.provide(HtmlRenderTemplate));
}
