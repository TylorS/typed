---
title: "Render your first template"
summary: "Extend Quick Start with one live search field and verify its editing loop."
section: "Template authoring"
kind: "guide"
order: 1
---

<span id="app"></span>

Start from the [Quick Start Vite project](/explore/quick-start), which already installs the packages,
mounts into `document.body`, and starts one browser owner. This is its first extension: add a field that records
an edit and displays it.

## Connect one user action to one value

Save this view as `src/SearchPage.ts`.
`component` creates the state when the view runs; `html` describes the elements and their bindings.

```ts file="SearchPage.ts"
import { RefSubject } from "@typed/fx";
import { component, html } from "@typed/template";
import * as EventHandler from "@typed/template/EventHandler";

export const SearchPage = component(function* () {
  const query = yield* RefSubject.make("");

  const readInput = EventHandler.make((event: Event) =>
    RefSubject.set(query, (event.currentTarget as HTMLInputElement).value),
  );

  return html`<main>
    <h1>Saved articles</h1>
    <label>
      Search terms
      <input type="search" .value=${query} oninput=${readInput} />
    </label>
    <output>Current query: ${query}</output>
  </main>`;
});
```

In `src/main.ts`, replace the Counter import and rendered view. Keep the same runtime lifetime:

```ts file="main.ts"
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { SearchPage } from "./SearchPage.js";

await render(SearchPage, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
);
```

`SearchPage` is an Fx value; constructing it starts no render. When it runs, the subject provides
the initial empty string and later changes. `.value` writes the input's live
property. `oninput` receives the browser event and returns an Effect that stores the edit. The output
subscribes to the same subject. Typing changes those retained parts; it does not recreate the main,
label, or input and does not rerun the setup generator.

This is an editing loop. [Request state](/explore/async-data-requests-and-cache) can later consume
the query without changing how the field records edits.

## Check the editing loop

Type into the input and observe the output. Keep a reference to the input in DevTools and confirm
it remains the same node after another edit. If nothing appears or updates stop, check the running
entry using [Mounting DOM output](/explore/mounting-dom-output).

Continue with [Authoring Typed templates](/explore/authoring-typed-templates) to extract the field
while keeping its state with the page.
