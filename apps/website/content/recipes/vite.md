---
slug: vite
title: Mount a Typed application with Vite
summary: Give a plain Vite entry point one DOM runtime, an explicit mount, and predictable development cleanup.
---

Use this when a Vite application needs a Typed screen without a framework shell. Vite owns bundling and development module updates. Typed owns the children of one application host; the entry module owns the runtime that supplies DOM rendering services.

Start with [building UI components](/explore/building-ui-components). Give this entry one application host and keep its runtime alive for as long as that application is mounted.

## Start from an empty host

Your `index.html` needs `<div id="app"></div>` and a module script pointing to the entry below. The example uses the existing Typed packages, Effect, and Vite's client types. In a standalone app, install matching Typed and Effect versions and use Vite's normal HTML entry; no renderer plugin is required for this runtime template example.

```ts
/// <reference types="vite/client" />
import { Effect, ManagedRuntime } from "effect";
import * as Fx from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { component } from "@typed/ui/Component";
import { Button } from "@typed/ui/Button";

const Counter = component(function* () {
  const count = yield* RefSubject.make(0);
  return html`<section>
    <h1>Vite workspace</h1>
    <output>${count}</output>
    ${Button({ content: "Add one", onclick: RefSubject.increment(count) })}
  </section>`;
});

const host = document.getElementById("app");
if (host === null) throw new Error("Missing #app mount element");
const runtime = ManagedRuntime.make(DomRenderTemplate.using(document));
runtime.runFork(Effect.scoped(Fx.drain(render(Counter, host))));

export const stopApplication = () => runtime.dispose();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    void stopApplication();
  });
}
```

The runtime is created once by this entry. The component creates state once per render lifetime; its button updates that state without restarting the application. The embedding shell can call `stopApplication` when it removes this app. Disposing the runtime interrupts work it started and closes scopes.

## Choose reload or custom hot replacement

This entry deliberately does not self-accept hot updates. Let Vite propagate changes to an accepting boundary or reload the page; local counter state may reset. Its disposal hook releases persistent side effects when Vite replaces an accepted module. Vite's hook does not promise to await asynchronous cleanup before a new module runs. For a custom self-accepting boundary, keep a stable owner outside the updated module and serialize old runtime disposal before the next mount. Do not simply add `accept()` and assume Typed state survives.

Vite requires the `import.meta.hot` guard and provides its types in `vite/client`; see the [Vite HMR API](https://vite.dev/guide/api-hmr). Template compilation optimization is a separate build choice: validate the emitted bundle before attributing a size change to mounting or HMR.

## Verify the entry you will deploy

In development, click the button, edit the component, and check that the page still has one host and one click response. A growing listener or subscription count after edits signals an owner that outlives its module. Test application removal through `stopApplication`, including any long-lived resources your component acquires.

Build and serve Vite's production output too. `import.meta.hot` is absent there, so shutdown must be an application lifecycle action rather than an HMR-only action. A missing asset under a subpath is a Vite `base`/deployment issue; a missing `#app` is an HTML entry issue. Diagnose those before changing the Typed component. See [Vite production builds](https://vite.dev/guide/build).
