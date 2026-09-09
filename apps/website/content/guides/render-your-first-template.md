---
title: "Render your first template"
summary: "Extend Quick Start with one live search field and verify its editing loop."
section: "Template authoring"
kind: "guide"
order: 1
---

<span id="app"></span>

Start from the [Quick Start Vite project](/explore/quick-start), which already installs the packages,
provides `#app`, and starts one browser owner. This is its first extension: add a field that records
an edit and displays it.

## Describe the view before running it

Start with direct `html` for fixed markup. It needs no component setup; keeping the first view this
small makes the browser boundary visible before introducing state:

```ts
import { html } from "@typed/template";

export const SearchPage = html`<main>
  <h1>Saved articles</h1>
  <label>Search terms <input type="search" /></label>
</main>`;
```

`SearchPage` is the Fx value returned by the tag. It is not a DOM element or a Promise.
Constructing it starts no work. The `html` tag
keeps the static markup and dynamic positions available for the renderer that eventually runs it.

## Give that program a browser owner

Keep the Quick Start entry. This complete reference shows the owner the extension expects:

```ts
import { Effect, Fiber } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

const SearchPage = html`<main>
  <h1>Saved articles</h1>
  <label>Search terms <input type="search" /></label>
</main>`;

const host = document.querySelector<HTMLElement>("#app");
if (host === null) throw new Error("Create #app before starting the application");

const application = SearchPage.pipe(
  render(host),
  Fx.drain,
  Effect.provide(DomRenderTemplate.using(host.ownerDocument)),
  Effect.scoped,
);

const fiber = Effect.runFork(application);
export const stop = () => Effect.runPromise(Fiber.interrupt(fiber));
```

Read this from the view outward. `render(host)` places its output in a dedicated element.
`Fx.drain` runs the output program without collecting a history of emitted values.
`DomRenderTemplate` provides the service that interprets templates as native DOM.
`Effect.scoped` gives the work a resource lifetime. The browser entry starts that lifetime with
`runFork` and retains the fiber so its shutdown path can interrupt it.

A live view is expected to remain running. Waiting for it to finish before displaying it would be
waiting for the wrong event. Conversely, interrupting it immediately after its first output would
close the subscriptions and listeners that make it interactive.

Use a dedicated host. Fresh root output can replace that host's children; the static navigation,
another application's widgets, and unrelated nodes belong beside that host.

## Connect one user action to one value

Use `component` to create state when the view runs, then replace the static `SearchPage` with this
version while leaving the mounting code unchanged:

```ts
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

The generator produces an Fx value. Its subject provides the initial
empty string and later changes. `.value` writes the input's live
property. `oninput` receives the browser event and returns an Effect that stores the edit. The output
subscribes to the same subject. Typing changes those retained parts; it does not recreate the main,
label, or input and does not rerun the setup generator.

This is a controlled editing loop, not a search request implementation. Request timing, cancellation,
and results can be added above the field once this loop works.

## Check the boundaries you just created

Type into the input and observe the output. Keep a reference to the input in DevTools and confirm
it remains the same node after another edit. Then call the entry's `stop`: later input events should
no longer run this render's handler. Scope closure releases running work; an outer host may separately
clear its dedicated children as part of its teardown policy.

If nothing appears, check the host and the rendering fiber's failure before debugging the handler.
If typing changes the input but not the output, check whether the render is still alive. If each
edit produces duplicate work, check whether the entry started two render programs for the same host.

Continue with [Authoring Typed templates](/explore/authoring-typed-templates) to extract the finished
field. [Mounting DOM output](/explore/mounting-dom-output) is optional reference for an embedded host.
