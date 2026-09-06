import { html } from "@typed/template";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import { Effect } from "effect";
import { MarbleView } from "../site/components/MarbleView.js";
import { parseFxMarble } from "./MarbleDiagram.js";

export { parseFxMarble } from "./MarbleDiagram.js";

/** Static Markdown uses the same Typed template that the browser hydrates. */
export const renderFxMarble = (source: string): string | undefined => {
  const diagram = parseFxMarble(source);
  if (!diagram) return undefined;
  return Effect.runSync(
    renderToHtmlString(
      html`<div class="fx-marble-mount" data-fx-marble-source=${source}>${MarbleView(diagram)}</div>`,
    ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
  );
};
