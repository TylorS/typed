import { HtmlRenderTemplate, html, renderToHtmlString } from "@typed/template";
import { Effect } from "effect";
import { Counter } from "./Counter.js";

// Server and browser render the same Counter module into this host.
const Document = html`<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Typed Counter</title>
  </head>
  <body>
    <main id="app">${Counter}</main>
    <script type="module" src="/src/client.ts"></script>
  </body>
</html>`;

export const markup =
  "<!doctype html>" +
  (await renderToHtmlString(Document).pipe(
    Effect.provide(HtmlRenderTemplate),
    Effect.scoped,
    Effect.runPromise,
  ));
