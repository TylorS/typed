---
slug: svelte
title: "Use Svelte 5 and Typed together"
summary: "Use @typed/svelte for bidirectional rendering, native stores, Effect services, and matching server and browser snapshots."
---

See [streaming SSR across framework boundaries](/explore/streaming-framework-integrations) for which component bodies stream and which are buffered.

`@typed/svelte` preserves Svelte component state while Typed updates its props, and lets a Svelte application render Typed views. Native stores expose Effect resources without a component-local subscription adapter. Use a Svelte 5 build that compiles `.svelte` files with the matching runtime.

`view` requires `RandomValues` from `@typed/id/RandomValues` for automatic IDs. This service stays in the returned `Fx` requirements. Provide `RandomValues.Default` (or your own implementation) alongside the renderer at the application boundary; the integration does not choose an entropy source.

## Install

Install the integration with matching Typed beta packages:

```sh
pnpm add @typed/svelte@beta @typed/template@beta @typed/fx@beta @typed/id@beta @typed/async-data@beta @typed/router@beta @typed/navigation@beta @typed/ui@beta effect@4.0.0-rc.112 svelte@^5.57.0
```

Keep Typed packages on the same beta release family and use the supported Effect v4 release shown above.

The package exports precompiled browser and server implementations of `Typed.svelte`. Your application still compiles its own `.svelte` files normally; importing the integration does not require enabling Svelte's experimental async compiler option in the application.

## Check Svelte components

When working on `@typed/svelte` in this repository, `packages/svelte/svelte.config.js` is the shared compiler configuration for the editor, Vite, and the component build. It enables async compilation for the integration's server-rendered component. Keep compiler settings there so all three use the same behavior.

```sh
pnpm --filter @typed/svelte check:svelte
```

This checks `.svelte` components, their fixtures, and TypeScript imports, and fails on errors or warnings. `build`, `build:components`, and `test:types` include this check; checking only `.ts` files does not validate Svelte templates. The command recreates its temporary checker output on every run so deleted files cannot leave stale diagnostics.

## Svelte output inside Typed

The editor keeps its draft while incoming metadata changes. Save this as `DocumentEditor.svelte`:

```svelte
<!-- DocumentEditor.svelte -->
<script lang="ts">
  let { title, saved }: { title: string; saved: boolean } = $props();
  let draft = $state("");
</script>

<section>
  <h2>{title}</h2>
  <label>Document text <textarea bind:value={draft}></textarea></label>
  <p>{saved ? "Saved" : "Unsaved changes"}</p>
</section>
```

Pass the imported component to `editorPage`. `view` generates a unique host ID for each rendered island and restores it from server markup during hydration. An optional `id` override can provide an application-specific ID; explicit IDs must be unique on the page and match between server and browser. It accepts plain props, `Effect`, `Stream`, or `Fx`; a props update preserves the mounted Svelte instance.

```ts file="editor-page.ts"
import type { Component } from "svelte";
import { RefSubject } from "@typed/fx";
import { view } from "@typed/svelte";
import { html, component } from "@typed/template";

export const editorPage = (Editor: Component<{ title: string; saved: boolean }>) =>
  component(function* () {
    const metadata = yield* RefSubject.make({ title: "Draft", saved: false });
    return html`<main>
      ${view(Editor, metadata)}
      <button onclick=${RefSubject.update(metadata, (value) => ({ ...value, saved: true }))}>
        Mark saved
      </button>
    </main>`;
  });
```

Pass the view directly to Typed’s `render`, `renderToHtml`, or `renderToHtmlString`. `view` selects and supplies Svelte’s backend from the active Typed renderer. The same entrypoints handle browser rendering, SSR, and build-time static HTML. Browser rendering adopts existing server hosts; start with matching props.

```ts file="render-page.ts"
import { RandomValues } from "@typed/id/RandomValues";
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { HtmlRenderTemplate, renderToHtml, renderToHtmlString } from "@typed/template/Html";
import { editorPage } from "./editor-page.js";
import DocumentEditor from "./DocumentEditor.svelte";

const page = editorPage(DocumentEditor);

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

These are Typed’s standard renderer layers; `view` composes the framework’s server output as a native template child and mounts through the template’s ref in the browser. Prefer `htmlChunks` for a streaming response, observed inside the request Scope. Use `renderPage` when a complete string is required, including static generation. Both preserve the same HTML order and hydration markers. Compose `pageLayer(host)` with the application’s other Layers. At the application boundary, `mountPage` launches that Layer and returns the fiber to interrupt at shutdown.

Svelte’s public server API returns a complete `body` and `head`. The surrounding Typed template and opening Svelte host stream immediately; the Svelte body follows when its props and asynchronous rendering are ready. `onHead` receives the completed head output. This also applies to static rendering.

## Share services and resource stores

Save this shared service as `profile.ts`. Server, browser, and test runtimes can provide different implementations of the same contract.

```ts file="profile.ts"
import { Context, Effect, Layer } from "effect";
import { html } from "@typed/template";

export class ProfileService extends Context.Service<ProfileService, {
  readonly name: Effect.Effect<string>;
}>()("ProfileService") {}

export const ProfileLive = Layer.succeed(ProfileService, { name: Effect.succeed("Ada") });
export const loadName = Effect.flatMap(ProfileService, (profile) => profile.name);
export const status = html`<p role="status">Account ready</p>`;
```

`useSource` returns native Svelte stores. Destructure the fields you use so Svelte's `$store` syntax subscribes and updates the template normally.

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  import { Option } from "effect";
  import * as AsyncData from "@typed/async-data";
  import { useSource } from "@typed/svelte/Reactive";
  import { loadName } from "./profile.js";

  let { initialName }: { initialName: string } = $props();
  const profile = useSource(loadName, { initial: AsyncData.success(initialName) });
  const { latest, pending, failure } = profile;
</script>

<section aria-busy={$pending}>
  <h2>Profile</h2>
  <p>{Option.getOrElse($latest, () => "Loading…")}</p>
  {#if $failure}<p role="alert">Could not load the profile.</p>{/if}
  <button onclick={profile.refresh}>Refresh</button>
</section>
```

| Input                              | Native Svelte binding                                                |
| ---------------------------------- | -------------------------------------------------------------------- |
| Value, `Effect`, `Stream`, or `Fx` | `useSource(source, { initial })`                                     |
| Effect service                     | `useService(Service, { initial })`                                   |
| `RefSubject`                       | `useRefSubject(ref, options?)` returns a writable store and `.state` |
| Existing `AsyncData` producer      | `useAsyncData(source, { initial })` preserves its state model        |
| Existing Svelte store              | `fromReadable` from `@typed/svelte/Store` lifts it into Typed        |

Resource fields include `data`, `value`, `latest`, `cause`, `error`, `pending`, `refreshing`, and `optimistic`. Values and failures use `Option`; the underlying `data` remains Typed `AsyncData`. Refresh keeps an available value visible. `latest` remembers the last available value when the current state has none. `refresh()` restarts the source and `cancel()` interrupts it. A readable source or runtime store can replace the producer; cleanup finishes before the replacement starts.

Use the native writable bridge for shared state:

```svelte
<!-- SharedCounter.svelte -->
<script lang="ts">
  import type * as RefSubject from "@typed/fx/RefSubject";
  import { useRefSubject } from "@typed/svelte/Reactive";

  let { count }: {
    count: RefSubject.RefSubject<number>;
  } = $props();
  const value = useRefSubject(count);
</script>

<button onclick={() => value.update((current) => current + 1)}>{$value}</button>
```

The owner creates `count` in its Scope. The store starts with `undefined` and `NoData`, then observes the ref through `useSource` after mount. Values and failures arrive through that subscription, with failures available in `.state`. If hydration needs an explicit transported snapshot, pass `{ initial: snapshot }` on the server and client, which also narrows the store's value from `A | undefined` to `A`. Local writes use serialized RefSubject transactions. The writable store accepts failing refs, including hydrated state; `set` and `update` return `Promise<Exit>`, and `.state` exposes read and write failures even when a native binding ignores that result. Runtime replacement and unmount interrupt pending writes. To display an optimistic save, pass an `Fx` or store of `AsyncData` to `useAsyncData`; its `value` includes the optimistic value and its `optimistic` store identifies the pending edit.

## Typed output inside Svelte

`provideRuntime` installs a borrowed runtime for the component's descendants. `Typed.svelte` uses it automatically and supplies its own template renderer and Scope. A view without application services needs no runtime; an explicit `runtime` prop can select one for a single view. Its host ID defaults to Svelte’s native `$props.id()`; an explicit `id` can override it. `onReady` runs after the first output is attached or hydrated. Save this component as `App.svelte` beside `Profile.svelte`:

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { toStore } from "svelte/store";
  import Typed from "@typed/svelte/Typed.svelte";
  import { provideRuntime } from "@typed/svelte/Runtime";
  import type { AppProps } from "./app-props.js";
  import { status } from "./profile.js";
  import Profile from "./Profile.svelte";

  let { runtime, initialName }: AppProps = $props();
  provideRuntime(toStore(() => runtime));
</script>

<Profile {initialName} />
<Typed value={status} onError={console.error} />
```

```ts file="app-props.ts"
import type { Runtime } from "@typed/svelte/Runtime";
import type { ProfileService } from "./profile.js";

export interface AppProps {
  readonly runtime: Runtime<ProfileService>;
  readonly initialName: string;
}
```

Use `provideServices(Context.make(Service, implementation))` during component initialization to override selected services for descendants while preserving the parent's other services. `fromContext` adapts already-built Effect services, and `runtimeContext` creates the context map for Svelte's imperative `mount`, `hydrate`, or server `render`. These helpers borrow resources; the application or request owns runtime disposal. `toReadable` and `toWritable` from `@typed/svelte/Store` are scoped Effects for exposing non-failing Typed sources to an existing Svelte store consumer. Use the AsyncData bindings when the source can fail. `attachment` from `@typed/svelte/Attachment` supports an existing Svelte element as the Typed root when an automatic component host does not fit the layout.

## Prefetch in the request and hydrate the snapshot

Resource stores start after mount. On the server they read `initial` and do not run application Effects. Prefetch request data explicitly, and pass it to both server and client. The helper below receives the imported `App.svelte` component.

```ts file="server.ts"
import type { Component } from "svelte";
import { render } from "svelte/server";
import { ManagedRuntime, Option } from "effect";
import * as AsyncData from "@typed/async-data";
import { prefetch } from "@typed/svelte/Reactive";
import type { AppProps } from "./app-props.js";
import { loadName, ProfileLive } from "./profile.js";

export async function renderApp(App: Component<AppProps>) {
  const runtime = ManagedRuntime.make(ProfileLive);
  try {
    const initial = await runtime.runPromise(prefetch(loadName));
    const initialName = Option.getOrThrow(AsyncData.getSuccess(initial));
    const output = await render(App, { props: { runtime, initialName } });
    return { html: output.body, head: output.head, data: { initialName } };
  } finally {
    await runtime.dispose();
  }
}
```

`prefetch` takes one snapshot and closes that producer's Scope. This example requires success before sending a response; an application that renders failures can transport its full `AsyncData` snapshot using an appropriate codec. `Typed` renders its own HTML as part of Svelte’s normal server render and adopts it during hydration. Return Svelte’s `head` and `body` through your normal document layout; no separate Typed markup snapshot is needed.

```ts file="browser.ts"
import { hydrate, unmount, type Component } from "svelte";
import { ManagedRuntime } from "effect";
import type { AppProps } from "./app-props.js";
import { ProfileLive } from "./profile.js";

export function hydrateApp(App: Component<AppProps>, target: HTMLElement,
  data: Pick<AppProps, "initialName">) {
  const runtime = ManagedRuntime.make(ProfileLive);
  const app = hydrate(App, { target, props: { runtime, ...data } });
  return async () => { await unmount(app); await runtime.dispose(); };
}
```

For a browser-only application, use Svelte’s `mount` with the same component. For a Typed-owned page, use Typed’s `render`; the integration chooses mounting or hydration from the native host ref.

## Routes, navigation, and test services

Provide `BrowserRouter`, `ServerRouter`, or `TestRouter` in the same runtime as application services. Native route stores use Typed's matcher, including decoded parameters. `CurrentRoute` describes the structural route owner; it is distinct from the current browser location.

```svelte
<!-- Navigation.svelte -->
<script lang="ts">
  import { Option } from "effect";
  import * as Route from "@typed/router/Route";
  import { useCurrentPath, useNavigation, useRoute } from "@typed/svelte/Router";

  const navigation = useNavigation();
  const { latest: path } = useCurrentPath();
  const { latest: matched } = useRoute(Route.Parse("/profile"));
  const openProfile = () => navigation.navigate("/profile").catch(console.error);
</script>

<nav>
  <button onclick={openProfile}>Profile</button>
  <span>{Option.getOrElse($path, () => "/")}</span>
  {#if Option.isSome($matched) && Option.isSome($matched.value)}<span>Profile selected</span>{/if}
</nav>
```

For a Typed-owned route tree, return `view` from the actual matcher handler. Decoded params remain reactive, and the selected handler's services and `CurrentRoute` reach Svelte and nested Typed content automatically:

```ts
import type { Component } from "svelte";
import { view } from "@typed/svelte";
import { html } from "@typed/template";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";

export const profileRoutes = (ProfilePage: Component<{ id: string }>) =>
  Matcher.match(Route.Parse("/profile/:id"), (params) => view(ProfilePage, params))
    .match(Route.Wildcard, html`<p>Choose a profile.</p>`);
```

Call `provideCurrentRoute(fullRoute)` in a route layout to extend the route ancestry for its descendants, including nested Typed views. `useCurrentRoute` reads that owner; `useNavigation` exposes location, entries, transition, history availability, and navigation commands. For request HTML, supply initial route snapshots just as for other stores.

`useRoute(route, { currentRoute: { route: Route.Parse("/admin") } })` uses that mount instead of the ambient one; `{ route: Route.Slash }` matches from `/`. The supplied mount is applied once. Its wildcard fallback returns `None` inside that mount, while leaving it reports the native `RouteNotFound` failure. Omitting `currentRoute` keeps the default global fallback, which remains live when leaving and reentering the ambient mount. The option also accepts a Svelte readable store.

```ts
import { expect, it } from "vitest";
import { Effect, Layer, ManagedRuntime } from "effect";
import { Navigation } from "@typed/navigation/Navigation";
import { TestRouter } from "@typed/router/RouterTest";
import { ProfileService } from "./profile.js";

it("renders with test services", async () => {
  const runtime = ManagedRuntime.make(Layer.merge(
    Layer.succeed(ProfileService, { name: Effect.succeed("Test user") }),
    TestRouter({ url: "https://example.test/profile" }),
  ));
  try {
    const entry = await runtime.runPromise(Effect.scoped(Navigation.currentEntry));
    expect(entry.url.pathname).toBe("/profile");
    // Pass this runtime to App or a component fixture to test its native stores and navigation.
  } finally {
    await runtime.dispose();
  }
});
```

## Configure event bubbling

`view(Component, props, { stopPropagation: { click: true } })` configures the Svelte-in-Typed root. The inverse component accepts the same policy:

```svelte
<!-- EventBoundary.svelte -->
<script lang="ts">
  import Typed from "@typed/svelte/Typed.svelte";
  import { status } from "./profile.js";
</script>

<Typed value={status} stopPropagation={{ click: true, keydown: false }} onError={console.error} />
```

Provide `CurrentRootEvents` from `@typed/template/RootEvents` through the surrounding Effect Context or `provideServices` to establish a default. Undefined inherits, an object overrides each named event, and `false` disables the inherited policy. A `true` entry stops bubbling at the root; target listeners and default actions still run, and ancestor capture listeners have already run. `rootEvents(root, options)` exposes the same scoped behavior for a custom host. `view` also forwards Svelte `context`, `idPrefix`, CSP, and error-transform options; preserve those identities between server and client.

Automatic `div` hosts use `display: contents` to remove layout boxes while retaining DOM ownership boundaries and separate hydration markers. Place them where an HTML `div` is valid; the style does not change table or SVG parsing rules. Svelte owns its components; Typed owns its renderable ranges. Unmount closes child subscriptions and their Scope, while borrowed runtimes remain with the application or request. Keep the same live renderable for ordinary updates; replacing it deliberately replaces the Typed work. Updating `onReady`, `onError`, or `stopPropagation` preserves that work. `onError` receives the Effect `Cause`; without a callback, the host dispatches `typed:error`. Normal cleanup interruption is silent.

The native template ref initializes the framework root. Its mount callbacks can run before the surrounding Typed tree reaches its destination. Svelte readiness and DOM attachment are separate: measure or focus only after the outer owner has placed the host. Raw `RenderEvent` consumers own placement themselves.
