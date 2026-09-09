---
slug: web-component
title: "Use Web Components and Typed together"
summary: "Define a Typed custom element once, then use the same view and services in browsers, server rendering, and tests."
---

Use `@typed/template/WebComponent` to publish a Typed feature as a native custom element. The definition supplies reactive props and a renderable; registration handles connection, disconnection, and hydration. Consumers use attributes, properties, slots, and DOM events.

## Install

The integration is part of `@typed/template`; there is no separate Web Components package. Install the published beta packages:

```sh
pnpm add @typed/template@beta @typed/fx@beta @typed/async-data@beta @typed/router@beta @typed/navigation@beta effect@4.0.0-rc.112
```

Use matching Typed beta versions when adding other Typed packages to the application.

## Typed output inside a custom element

Save this as `counter.ts`. The definition can be imported on the server because `make` does not read browser globals. The `CounterLabels` service supplies application text; each connection owns its own click state.

```ts file="counter.ts"
import { Context, Effect, Schema } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import * as WebComponent from "@typed/template/WebComponent";

export class CounterLabels extends Context.Service<CounterLabels, {
  readonly increment: string;
}>()("CounterLabels") {}

export const counter = WebComponent.make({
  name: "typed-counter",
  attributes: {
    title: Schema.String.pipe(
      Schema.withDecodingDefaultKey(Effect.succeed("Counter")),
    ),
  },
  render: Fx.fn(function* ({ title }: { readonly title: RefSubject.Computed<string> }) {
    const labels = yield* CounterLabels;
    const clicks = yield* RefSubject.make(0);
    return html`<section>
      <h2>${title}</h2>
      <button onclick=${RefSubject.increment(clicks)}>${labels.increment}</button>
      <output>${clicks}</output>
      <slot></slot>
    </section>`;
  }),
});
```

Templates retain the ordinary Typed contract: interpolate values, `Effect`, `Stream`, and `Fx`; use the [AsyncData values and matching](/explore/async-data) for loading and failure states. Read application services with `yield*`, including `Navigation` and `CurrentRoute` when your runtime provides the [router services](/explore/routing-routes-matchers-and-navigation).

Register with a layer and compose it with the application's rendering layer. Registration provides no services; its Scope owns the connected instances. Use the element in an ordinary template.

```ts file="browser.ts"
import { Layer } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import * as WebComponent from "@typed/template/WebComponent";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { counter, CounterLabels } from "./counter.js";

export const CounterLive = WebComponent.register(counter).pipe(
  Layer.provide(Layer.succeed(CounterLabels, { increment: "Add one" })),
);

export const application = render(
  html`<typed-counter title="Items" />`,
  document.body,
).pipe(
  Fx.drainLayer,
  Layer.provide(Layer.merge(DomRenderTemplate, CounterLive)),
  Layer.launch,
);
```

The application runs through the usual Effect entrypoint. Closing its Scope releases the registration and every connected instance. Registration captures `CurrentRenderDocument` and `CurrentShadowRoot` from its layer, so provide those references at the boundary when rendering into another document or choosing light/closed shadow DOM.

## Custom-element output inside Typed

After registration, render the element like ordinary HTML. Declared attributes update its input snapshot. Each field passed to `render` is a read-only computed value created by `RefSubject.proxy`, so `${props.title}` observes that field directly. Browser code can also assign a complete `element.props` snapshot; the integration restores values assigned before upgrade.

```ts
import { html } from "@typed/template";

export const page = html`<main>
  <typed-counter title="Items"><p>Count items in this session.</p></typed-counter>
</main>`;
```

## Property inputs and schema defaults

Use the same dot prefix as template property bindings to declare inputs that hold typed values:

```ts
import { Effect, Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import * as WebComponent from "@typed/template/WebComponent";

export const greeting = WebComponent.make({
  name: "typed-greeting",
  attributes: {
    title: Schema.String.pipe(Schema.withDecodingDefaultKey(Effect.succeed("Hello"))),
    subtitle: Schema.optionalKey(Schema.String),
    ".user": Schema.Struct({ name: Schema.String }),
  },
  render: ({ title, subtitle, user }) => html`<p>
    ${title}, ${RefSubject.map(user, (value) => value.name)}! ${subtitle}
  </p>`,
});

// Register greeting before rendering this template.
export const page = html`<typed-greeting .user=${{ name: "Ada" }} />`;
export const serverPage = WebComponent.server(greeting, { user: { name: "Ada" } });
```

Attribute decoding defaults apply when an attribute is absent. `Schema.optionalKey` leaves a field absent, and its computed projection yields `undefined`. Removing an optional attribute clears its old value; removing a defaulted attribute restores its schema default. Required inputs must be available before rendering: an incomplete connected element reports `typed:error` and can start when valid inputs arrive. Until a complete input snapshot exists, `element.props` is `undefined`.

Property fields use schema constructor defaults (`Schema.withConstructorDefault`) and accept decoded values through native setters. These defaults are created per instance or server render and retained across browser reconnections. Both `.user` template bindings and direct `element.user` assignments update the corresponding computed field; pre-upgrade assignments are restored. Property names must not conflict with the element's existing API. Public inputs remain parent-owned; create writable local state inside `render`.

## Server rendering, hydration, and test services

`WebComponent.server` returns a Renderable. It produces the host, serialized attributes, and Typed hydration markers, with declarative open shadow DOM by default. Register the same definition in the browser to adopt its existing nodes. The `attributes` record contains synchronous schema fields; `WebComponent` builds the struct internally. Plain keys are observed HTML attribute names, and their schemas must encode strings. A key such as `".user"` declares a DOM property named `user`, accepts typed values, and is omitted from server attributes. Supply property values again before connecting or upgrading the element to match its server inputs.

Use Typed's existing HTML renderers. `renderToHtml` emits chunks as the body becomes available and then renders slot content; `renderToHtmlString` collects the same output for a static page or other string consumer.

```ts file="server.ts"
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { HtmlRenderTemplate, renderToHtml, renderToHtmlString } from "@typed/template/Html";
import * as WebComponent from "@typed/template/WebComponent";
import { counter, CounterLabels } from "./counter.js";

export const page = html`<main>
  ${WebComponent.server(counter, { title: "Items" }, html`<p>Session count</p>`)}
</main>`;

const Services = HtmlRenderTemplate.pipe(
  Layer.provideMerge(Layer.succeed(CounterLabels, { increment: "Add one" })),
);

export const response = renderToHtml(page).pipe(Fx.provide(Services));

export const snapshot = renderToHtmlString(page).pipe(
  Effect.provide(Services),
  Effect.scoped,
);
```

The request Scope owns the streamed response. Interruption releases pending work; failures remain in the Fx error channel. The host opening is emitted first, followed by the component body, the shadow template and slot content when shadow mode is enabled, and a final closing host event. `renderToHtml` can write those ordered chunks as they arrive; `renderToHtmlString` waits for the same sequence to finish.

Keep the shadow choice identical at both boundaries:

```ts
import { Effect, Layer } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import * as WebComponent from "@typed/template/WebComponent";
import { counter } from "./counter.js";

const OpenShadow = Layer.succeed(WebComponent.CurrentShadowRoot, { mode: "open" as const });
const CounterLive = WebComponent.register(counter).pipe(Layer.provide(OpenShadow));

const markup = renderToHtmlString(WebComponent.server(counter, { title: "Items" })).pipe(
  Effect.provide(Layer.merge(HtmlRenderTemplate, OpenShadow)),
  Effect.scoped,
);
```

Provide `CounterLive` alongside the application's `DomRenderTemplate` when starting the browser render. Use `false` in both layers for light DOM, or use the same open/closed mode in both layers; a mismatch is rejected during connection.

Use the same Renderable with replacement services in tests:

```ts file="counter.test.ts"
import { expect, it } from "vitest";
import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import * as WebComponent from "@typed/template/WebComponent";
import { counter, CounterLabels } from "./counter.js";

it("renders with test services", async () => {
  const markup = await Effect.runPromise(renderToHtmlString(WebComponent.server(counter)).pipe(
    Effect.provide(HtmlRenderTemplate),
    Effect.provideService(CounterLabels, { increment: "Test increment" }),
    Effect.scoped,
  ));

  expect(markup).toContain("Test increment");
});
```

Provide `CurrentShadowRoot` with `false` for light DOM, or a shadow configuration for open/closed roots. Match that choice on the server and browser. Shadow mode preserves light children for slots; light mode owns all host children. For browser tests, register a unique element name in each test and close its registration Scope after checking updates, disconnection, and retained hydration nodes.

## Effect resources, streams, and AsyncData

A custom element uses Typed's native reactive values directly. This example reads an application service, displays its connection Stream, and switches a profile request when the `profileId` prop changes. The request's failure becomes `AsyncData`, so it can render an error without ending the element's view.

```ts file="profile-element.ts"
import { Context, Effect, Schema, Stream } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import * as AsyncData from "@typed/async-data";
import { html } from "@typed/template";
import * as WebComponent from "@typed/template/WebComponent";

export class Profiles extends Context.Service<Profiles, {
  readonly load: (id: string) => Effect.Effect<string, Error>;
  readonly connection: Stream.Stream<string>;
}>()("Profiles") {}

export const profileElement = WebComponent.make({
  name: "typed-profile",
  attributes: {
    "profile-id": Schema.String.pipe(
      Schema.withDecodingDefaultKey(Effect.succeed("42")),
    ),
  },
  render: (props) => Effect.gen(function* () {
    const profiles = yield* Profiles;
    const request = Fx.switchMap(props["profile-id"], (profileId) => Fx.concat(
      Fx.succeed(AsyncData.loading()),
      Fx.fromEffect(Effect.map(Effect.exit(profiles.load(profileId)), AsyncData.fromExit)),
    ));
    const content = Fx.map(request, (data) => AsyncData.match(data, {
      NoData: () => "Choose a profile.",
      Loading: () => "Loading…",
      Success: (name) => name,
      Failure: () => "Profile unavailable.",
      Optimistic: (name) => `${name} (saving)`,
    }));
    return html`<section><small>${profiles.connection}</small><p>${content}</p></section>`;
  }),
});
```

This source intentionally starts with Loading, which is also its first server snapshot. For prefetched HTML, make the initial state part of the element's props and restore the same state before browser upgrade. Use the attribute schema only for values that have a suitable string representation. Rich resource state needs the application's serialized-data transport.

`AsyncData.startLoading` retains an available value while refreshing, and `AsyncData.optimistic(previous, value)` preserves the previous state for rollback. `AsyncData.getSuccess` reads success or optimistic content; `getCause` preserves complete failures. If the UI should retain an older value after a failed refresh, store that value in its model explicitly. The native framework bindings offer `latest`; a plain AsyncData failure has no implicit stale-value field.

## Routes and deterministic test history

Custom elements can host the same Typed matcher and navigation services as the surrounding app. The route handler establishes `CurrentRoute` for its nested view:

```ts file="routed-element.ts"
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { Navigation } from "@typed/navigation/Navigation";
import { CurrentRoute } from "@typed/router/CurrentRoute";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";
import { html } from "@typed/template";
import * as WebComponent from "@typed/template/WebComponent";

const users = Matcher.match(Route.Parse("/users/:id"), (params) => html`<section>
  <h2>User ${RefSubject.map(params, (value) => value.id)}</h2>
  <small>${Effect.map(CurrentRoute, (owner) => owner.route.path)}</small>
</section>`).match(Route.Wildcard, html`<p>Choose a user.</p>`);

export const userElement = WebComponent.make({
  name: "typed-users",
  render: () => html`<nav>
    <button onclick=${Navigation.navigate("/users/42")}>User 42</button>
  </nav>${users}`,
});
```

Provide `BrowserRouter` to the registration layer, or `ServerRouter` with the request URL to server rendering. Registration captures those services; each connected instance borrows that navigation backend. Tests use the same definition with `TestRouter`:

```ts
import { expect, it } from "vitest";
import { Effect } from "effect";
import { TestRouter } from "@typed/router/RouterTest";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import * as WebComponent from "@typed/template/WebComponent";
import { userElement } from "./routed-element.js";

it("uses deterministic test navigation", async () => {
  const markup = await Effect.runPromise(renderToHtmlString(WebComponent.server(userElement)).pipe(
    Effect.provide(HtmlRenderTemplate),
    Effect.provide(TestRouter({ url: "https://example.test/users/42" })),
    Effect.scoped,
  ));
  expect(markup).toContain("42");
});
```

## Configure event bubbling

Element events bubble normally. An element definition can stop selected events at its render root:

```ts
import * as WebComponent from "@typed/template/WebComponent";
import { counter } from "./counter.js";

export const guardedCounter = WebComponent.make({
  ...counter,
  name: "typed-guarded-counter",
  stopPropagation: { click: true, keydown: false },
});
```

`CurrentRootEvents` from `@typed/template/RootEvents` supplies an inherited default through Effect provisioning. Undefined inherits, an object overrides named events, and `false` disables the inherited policy. `true` stops bubbling after inner handlers run; it does not prevent default actions or suppress ancestor capture listeners. `rootEvents(root, options)` installs this same behavior on a custom host with scoped cleanup. Shadow DOM's native composed-event rules still apply.

The automatic `display: contents` style removes the host's layout box; the element remains the DOM ownership boundary. Each disconnection interrupts that instance's work, and reconnection waits for cleanup before starting again. Closing the registration Scope stops all its instances and deactivates the registered class; a browser registry cannot unregister it. Child instances never dispose the application runtime. Render failures emit `typed:error`, with the Effect `Cause` in `CustomEvent.detail`.
