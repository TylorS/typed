import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import type { Renderable } from "@typed/template/Renderable";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import type { Runtime } from "../Runtime.js";
import { getAbortSignal } from "svelte";

/** Runs within Svelte's native request render; only the observation scope closes. */
export function renderSnapshot<V extends Renderable.Any, ER>(
  runtime: Runtime<Exclude<Exclude<Renderable.Services<V>, RenderTemplate>, Scope.Scope>, ER>,
  view: V,
): Promise<string> {
  const snapshot = renderToHtmlString(view).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped);

  return runtime.runPromise(snapshot, { signal: getAbortSignal() });
}
