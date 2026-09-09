---
slug: react
title: "Use React and Typed together"
summary: "Render in either direction with @typed/react, share Effect services through a provider, and preserve server HTML during hydration."
---

`@typed/react` connects React components to Typed views and Effect services. Use ordinary components, hooks, and props. The integration creates the rendering hosts and owns their subscriptions.

`view` requires `RandomValues` from `@typed/id/RandomValues` for automatic IDs. This service stays in the returned `Fx` requirements. Provide `RandomValues.Default` (or your own implementation) alongside the renderer at the application boundary; the integration does not choose an entropy source.

## Install

Install the integration with matching Typed beta packages:

```sh
pnpm add @typed/react@beta @typed/template@beta @typed/fx@beta @typed/id@beta @typed/async-data@beta @typed/router@beta effect@4.0.0-rc.112 react@^19.2.0 react-dom@^19.2.0
pnpm add -D @types/react@^19.2.0 @types/react-dom@^19.2.0
```

Keep Typed packages on the same beta release family and use the supported Effect v4 release shown above. Compile React examples as TSX.

## React output inside Typed

Pass a React component and its props to `view`. Each rendered island gets a unique host ID that hydration restores from server markup. Use the optional `id` override when application code needs a specific host ID; explicit IDs must be unique on the page and match between server and browser. Props can also be an `Effect`, `Stream`, or `Fx`; later values update the existing React root and preserve its component state.

```tsx file="Account.tsx"
import { useState } from "react";

export function Account({ name }: { readonly name: string }) {
  const [draft, setDraft] = useState("");
  return <section>
    <h2>{name}</h2>
    <label>Note <input value={draft} onChange={(event) => setDraft(event.target.value)} /></label>
  </section>;
}
```

```ts file="page.ts"
import { view } from "@typed/react";
import { html } from "@typed/template";
import { Account } from "./Account.js";

export const page = html`<main>${view(Account, { name: "Ada" })}</main>`;
```

An existing JSX value or other `ReactNode` can use the two-argument overload:

```tsx
import { view } from "@typed/react";
import { html } from "@typed/template";

export const banner = html`<header>${view(<strong>Account ready</strong>)}</header>`;
```

Use the component-and-props form when an Effect, Stream, or Fx should update its props.

The same `page` goes directly to Typed’s `render`, `renderToHtml`, or `renderToHtmlString`. `view` selects React’s backend from the active Typed renderer, including when HTML is rendered in a browser. Match initial props during hydration. React's shell and Suspense updates stream through Effect Stream into native HTML render events. The request Scope owns the stream; interruption aborts React and releases its reader.

```ts file="render-page.ts"
import { RandomValues } from "@typed/id/RandomValues";
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { HtmlRenderTemplate, renderToHtml, renderToHtmlString } from "@typed/template/Html";
import { page } from "./page.js";

export const htmlChunks = renderToHtml(page).pipe(Fx.provide(Layer.merge(HtmlRenderTemplate, RandomValues.Default)));

export const renderPage = () => Effect.runPromise(
  renderToHtmlString(page).pipe(Effect.provide(Layer.merge(HtmlRenderTemplate, RandomValues.Default)), Effect.scoped),
);

export const pageLayer = (host: HTMLElement) => render(page, host).pipe(
  Fx.drainLayer,
  Layer.provide(Layer.merge(DomRenderTemplate.using(host.ownerDocument), RandomValues.Default)),
);

export const mountPage = (host: HTMLElement) =>
  Effect.runFork(Layer.launch(pageLayer(host)));
```

These are Typed’s standard renderer layers. Consume `htmlChunks` inside the request Scope for streaming, or use `renderPage` when a complete string is needed. React's streamed Suspense output includes scripts that apply deferred content during normal HTML loading; retain those chunks before hydrating. Compose `pageLayer(host)` with the application’s other Layers. At the application boundary, `mountPage` launches that Layer and returns the fiber to interrupt at shutdown.

## Typed output inside React

Use `Typed` for a Typed renderable inside a React component. It supplies the template renderer and Scope; views without application services need no provider. When services are needed, its runtime comes from `Provider` or an explicit `runtime` prop. Keep ordinary live renderables stable across React renders. Replacing `value` replaces its Typed subscription. Its host ID defaults to React’s native `useId`; an explicit `id` can override it.

```tsx file="Status.tsx"
import { html } from "@typed/template";
import { Typed } from "@typed/react/Typed";

export const status = html`<p role="status">Account ready</p>`;

export function Status({ signal }: { readonly signal?: AbortSignal }) {
  return <Typed value={status} signal={signal} />;
}
```

## Share services and native reactive state

A provider accepts a borrowed `ManagedRuntime`, an already-built Effect `Context`, or a provider-owned `Layer`. All descendants, including nested Typed views, use those services. A nested `context` overlays selected services; `serviceContext(Service)` creates a service-specific Provider and `use` hook without a separate context key. Here React reads a service with `useService` and observes its Effect with the integration's `useEffect` hook.

```tsx file="Profile.tsx"
import { Context, Effect, Layer, Option } from "effect";
import * as AsyncData from "@typed/async-data";
import { useEffect } from "@typed/react/Hooks";
import { useService } from "@typed/react/Runtime";

export class ProfileService extends Context.Service<ProfileService, {
  readonly heading: string;
  readonly name: Effect.Effect<string>;
}>()("ProfileService") {}

export const ProfileLive = Layer.succeed(ProfileService, {
  heading: "Profile",
  name: Effect.succeed("Ada"),
});

export function Profile({ initialName }: { readonly initialName: string }) {
  const profile = useService(ProfileService);
  const name = useEffect(profile.name, { initial: AsyncData.success(initialName) });
  return <section aria-busy={name.pending}>
    <h2>{profile.heading}</h2>
    <p>{Option.getOrElse(name.latest, () => "Loading…")}</p>
    {name.failure && <p role="alert">Could not load the profile.</p>}
    <button onClick={name.refresh}>Refresh</button>
  </section>;
}
```

Use `useStream`, `useFx`, and `useRefSubject` for their corresponding sources. `useAsyncData` observes an existing `Fx<AsyncData>` without nesting its state; `AsyncData` from `@typed/react/AsyncData` offers render callbacks. The hooks expose full failure causes, latest values, pending/refreshing state, refresh, and cancellation. Memoize a source created during React rendering when its identity should remain stable.

A writable `RefSubject` can remain owned by a Typed parent or application service while React uses it directly:

```tsx
import type * as RefSubject from "@typed/fx/RefSubject";
import * as AsyncData from "@typed/async-data";
import { Option } from "effect";
import { useRefSubject } from "@typed/react/Hooks";

export function Counter({ count, initialCount }: {
  readonly count: RefSubject.RefSubject<number>;
  readonly initialCount: number;
}) {
  const state = useRefSubject(count, { initial: AsyncData.success(initialCount) });
  return <button onClick={() => { void state.update((value) => value + 1); }}>
    {Option.getOrElse(state.value, () => initialCount)}
  </button>;
}
```

`set`, `update`, and `useAction(...).run` return Effect `Exit` values. Use `useAction` for event-driven Effects; starting a newer invocation cancels the previous one. Its `refresh()` repeats the previous arguments with the current action function. `AsyncData.getSuccess(state.data)` includes optimistic values, and `AsyncData.isOptimistic(state.data)` identifies them. Refresh preserves available data; a later failure remains visible in `cause` while `latest` can keep prior content on screen. See [optimistic edits](/explore/async-data-optimistic-edits).

## Server rendering and hydration

Prepare services and data in the server request, then pass the same initial values to the client. Hooks read their `initial` snapshot during SSR; they start producers after the browser subscribes. A `layer` provider acquires services after commit, so use prepared runtime services or `context` for SSR. `fallback` covers pending acquisition; `onError` handles acquisition failures, or they reach React’s nearest error boundary when no handler is supplied. `prefetch(source)` from `@typed/react/Hooks` captures the first Effect/Stream/Fx value as `AsyncData` and closes its temporary Scope. It preserves the value, including `Option` and `undefined`, without interpreting it as a template. Pass that result as `initial` when a resource needs the full loading/failure model.

```tsx file="App.tsx"
import { Provider, type Runtime } from "@typed/react/Runtime";
import { Profile, ProfileService } from "./Profile.js";
import { Status } from "./Status.js";

export function App({ runtime, initialName, signal }: {
  readonly runtime: Runtime<ProfileService>;
  readonly initialName: string;
  readonly signal?: AbortSignal;
}) {
  return <Provider runtime={runtime}>
    <Profile initialName={initialName} />
    <Status signal={signal} />
  </Provider>;
}
```

```tsx file="server.tsx"
import { Effect, ManagedRuntime } from "effect";
import { renderToReadableStream } from "react-dom/server";
import { App } from "./App.js";
import { ProfileLive, ProfileService } from "./Profile.js";

export async function renderApp(
  send: (body: ReadableStream<Uint8Array>, data: { readonly initialName: string }) => Promise<void>,
  signal?: AbortSignal,
) {
  const runtime = ManagedRuntime.make(ProfileLive);

  try {
    await runtime.context();
    const initialName = await runtime.runPromise(
      Effect.flatMap(ProfileService, (profile) => profile.name),
      { signal },
    );
    const stream = await renderToReadableStream(
      <App runtime={runtime} initialName={initialName} signal={signal} />,
      { signal },
    );

    await send(stream, { initialName });
  } finally {
    await runtime.dispose();
  }
}
```

`send` is your response writer: it streams the body, transports `data` through the framework's request-data mechanism, and resolves after consuming or cancelling the stream. The runtime stays alive until then. Pass the request's abort signal to both React's stream and each `Typed` component so cancellation interrupts pending Typed server work too. The signal stays on the server.

React streams surrounding content and Suspense fallbacks while each Typed host collects its own HTML. For static generation or a complete string, await `stream.allReady` and collect the stream inside the same request lifetime. `Typed` produces and hydrates its own markup; only application data such as `initialName` travels through your framework’s request-data transport.

```tsx file="browser.tsx"
import { ManagedRuntime } from "effect";
import { hydrateRoot } from "react-dom/client";
import { App } from "./App.js";
import { ProfileLive } from "./Profile.js";

export async function hydrateApp(host: Element, data: {
  readonly initialName: string;
}) {
  const runtime = ManagedRuntime.make(ProfileLive);
  await runtime.context();
  const root = hydrateRoot(host, <App runtime={runtime} {...data} />);
  return async () => { root.unmount(); await runtime.dispose(); };
}
```

## Replace services in tests

Tests use the same provider. A built context supplies deterministic services immediately:

```tsx file="Profile.test.tsx"
import { expect, it } from "vitest";
import { Context, Effect } from "effect";
import { renderToString } from "react-dom/server";
import { Provider } from "@typed/react/Runtime";
import { Profile, ProfileService } from "./Profile.js";

it("renders with test services", async () => {
  const context = Context.make(ProfileService, {
    heading: "Test profile",
    name: Effect.succeed("Test user"),
  });
  const markup = renderToString(<Provider context={context}>
    <Profile initialName="Test user" />
  </Provider>);
  expect(markup).toContain("Test profile");
  expect(markup).toContain("Test user");
});
```

## Route handlers, navigation, and CurrentRoute

Provide `BrowserRouter` in the browser, `ServerRouter` for a request, or `TestRouter` from `@typed/router/RouterTest` in tests. `routeComponent` turns a React component into a Typed matcher handler whose props follow decoded route parameters. The matched handler's `CurrentRoute` and application services reach the component automatically.

```tsx file="routes.tsx"
import { html } from "@typed/template";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";
import { useAction } from "@typed/react/Hooks";
import { routeComponent, useCurrentRoute, useNavigation } from "@typed/react/Router";

function UserPage({ id }: { readonly id: string }) {
  const route = useCurrentRoute();
  const navigation = useNavigation();
  const home = useAction(() => navigation.navigate("/"));
  return <section>
    <h2>User {id}</h2>
    <small>Route: {route.route.path}</small>
    <button onClick={() => { void home.run(); }}>Home</button>
  </section>;
}

export const routes = Matcher.match(Route.Parse("/users/:id"), routeComponent(UserPage))
  .match(Route.Wildcard, html`<p>Choose a user.</p>`);
```

`useCurrentRoute` reads structural ancestry; `CurrentRouteProvider` extends it for descendants with a full mount route. `useRoute(Route.Parse("/users/:id"))` observes optional decoded params, `useCurrentPath` observes the current path, and `useLocation` observes the changing destination with the usual resource-state fields and initial snapshot option. `useNavigation` returns the shared navigation service, whose commands can run through `useAction` or `useRuntime`.

`useRoute(route, { currentRoute: { route: Route.Parse("/admin") } })` uses that mount instead of the ambient one; `{ route: Route.Slash }` matches from `/`. The supplied mount is applied once. Its wildcard fallback returns `None` inside that mount, while leaving it reports the native `RouteNotFound` failure. Omitting `currentRoute` keeps the default global fallback, which remains live when leaving and reentering the ambient mount.

```ts file="routes.test.ts"
import * as Layer from "effect/Layer";
import { RandomValues } from "@typed/id/RandomValues";
import { expect, it } from "vitest";
import { Effect, ManagedRuntime } from "effect";
import { TestRouter } from "@typed/router/RouterTest";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import { routes } from "./routes.js";

it("uses deterministic test navigation", async () => {
  const runtime = ManagedRuntime.make(TestRouter({ url: "https://example.test/users/42" }));
  try {
    const markup = await runtime.runPromise(
      renderToHtmlString(routes).pipe(Effect.provide(Layer.merge(HtmlRenderTemplate, RandomValues.Default)), Effect.scoped),
    );
    expect(markup).toContain("42");
  } finally {
    await runtime.dispose();
  }
});
```

## Configure event bubbling

Events bubble normally by default. Set `stopPropagation` on a React `view` or inverse `Typed` component, or provide `CurrentRootEvents` as an inherited default:

```tsx
import { Context } from "effect";
import { view } from "@typed/react";
import { Provider } from "@typed/react/Runtime";
import { Typed } from "@typed/react/Typed";
import { CurrentRootEvents } from "@typed/template/RootEvents";
import { Account } from "./Account.js";
import { status } from "./Status.js";

export const account = view(Account, { name: "Ada" }, { stopPropagation: { click: true } });
const events = Context.make(CurrentRootEvents, { click: true });
export const StatusBoundary = () => <Provider context={events}>
  <Typed value={status} stopPropagation={{ click: false, keydown: true }} onError={console.error} />
</Provider>;
```

Omitting the option inherits the policy; an object overrides named events; `false` disables inherited blocking. A `true` entry stops bubbling at that root after inner handlers run. It does not prevent default actions, stop other listeners on that same root, or suppress ancestor capture handlers that already ran. The listeners close with the root's Scope. For independent React roots using `useId`, provide matching, distinct `identifierPrefix` values on server and client; `onRecoverableError` reports recoverable hydration problems.

Automatic `div` hosts use `display: contents` to remove their layout boxes while remaining DOM ownership boundaries. Place them where an HTML `div` is valid; the style does not change table or SVG parsing rules. Each renderer controls its descendants; unmounting interrupts the child work and closes its Scope. A borrowed runtime stays owned by the application or request; only a provider-created runtime is disposed by that provider. Updating `stopPropagation` or `onError` preserves the current Typed rendering. Typed failures reach `onError` when supplied, otherwise React's error handling.

The native template ref initializes the framework root. Its mount callbacks can run before the surrounding Typed tree reaches its destination. React readiness and DOM attachment are separate: measure or focus only after the outer owner has placed the host. Raw `RenderEvent` consumers own placement themselves.
