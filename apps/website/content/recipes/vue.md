---
slug: vue
title: "Use Vue and Typed together"
summary: "Use @typed/vue for bidirectional rendering, native composables, shared Effect services, and request-local SSR and hydration."
---

See [streaming SSR across framework boundaries](/explore/streaming-framework-integrations) for which component bodies stream and which are buffered.

`@typed/vue` connects Vue components and Typed views without a hand-written mount adapter. Vue retains its local state as Typed updates incoming props; native composables expose the same Effect resources in a Vue application.

`view` requires `RandomValues` from `@typed/id/RandomValues` for automatic IDs. This service stays in the returned `Fx` requirements. Provide `RandomValues.Default` (or your own implementation) alongside the renderer at the application boundary; the integration does not choose an entropy source.

## Install

Install the integration with matching Typed beta packages:

```sh
pnpm add @typed/vue@beta @typed/template@beta @typed/fx@beta @typed/id@beta @typed/async-data@beta @typed/router@beta @typed/navigation@beta @typed/ui@beta effect@4.0.0-rc.112 vue@^3.5.42
```

Keep Typed packages on the same beta release family and use the supported Effect v4 release shown above.

The component examples use TSX. Enable Vue's JSX transform in your build tool, such as `@vitejs/plugin-vue-jsx` for Vite, and use these TypeScript options:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "vue"
  }
}
```

Vue's JSX types and transform differ from React's. See [Vue's TSX setup](https://vuejs.org/guide/extras/render-function#jsx-type-inference).

## Vue output inside Typed

The card owns its local alert threshold. `view` generates a unique host ID for each rendered island and restores it from server markup during hydration. An optional `id` override can provide an application-specific ID; explicit IDs must be unique on the page and match between server and browser. It accepts a Vue component and plain props, `Effect`, `Stream`, or `Fx`; subsequent values update that mounted component.

```tsx file="PriceCard.tsx"
import { defineComponent, ref } from "vue";

export const PriceCard = defineComponent({
  props: { symbol: { type: String, required: true }, last: { type: Number, required: true } },
  setup(props) {
    const threshold = ref("42");

    return () => (
      <section>
        <label>
          Alert threshold
          <input
            value={threshold.value}
            onInput={(event) => { threshold.value = (event.target as HTMLInputElement).value; }}
          />
        </label>
        <output>{props.symbol}: {props.last}</output>
      </section>
    );
  },
});
```

```ts file="page.ts"
import { view } from "@typed/vue";
import { RefSubject } from "@typed/fx";
import { html, component } from "@typed/template";
import { PriceCard } from "./PriceCard.js";

export const page = component(function* () {
  const price = yield* RefSubject.make({ symbol: "DEMO", last: 42 });
  return html`<main>
    ${view(PriceCard, price)}
    <button onclick=${RefSubject.update(price, (value) => ({ ...value, last: value.last + 1 }))}>
      Next price
    </button>
  </main>`;
});
```

Pass the page directly to Typed’s `render`, `renderToHtml`, or `renderToHtmlString`. `view` selects and supplies Vue’s backend from the active Typed renderer. SSR and build-time static rendering take the first props snapshot and create a fresh Vue app. The browser adopts that host, hydrates its contents, and keeps the instance for later props. Replace immutable props objects instead of mutating a nested field in place.

`view(Component, props, { configureApp })` configures each Vue app, including plugins and app-level providers. `view(Component, props, { onSSRContext })` exposes the request's Vue SSR context, including teleports; the application places those teleport fragments in its document.

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

These are Typed’s standard renderer layers; `view` composes the framework’s server output as a native template child and mounts through the template’s ref in the browser. Prefer `htmlChunks` for a streaming response, observed inside the request Scope. Use `renderPage` when a complete string is required, including static generation. Both preserve the same HTML order and hydration markers. Compose `pageLayer(host)` with the application’s other Layers. At the application boundary, `mountPage` launches that Layer and returns the fiber to interrupt at shutdown.

Vue’s native `renderToWebStream` supplies incremental HTML to Effect’s `Stream.fromReadableStream`. `view` forwards those chunks in tree order and closes its host after rendering and `onSSRContext` finish. A pending child delays its following siblings, while earlier HTML can already reach the response. Interrupting the request closes Typed resources and cancels the stream reader; Vue suppresses later output but does not abort arbitrary component promises.

## Effect services and native composables

Save this service as `services.ts`. The example uses local data so the rendering contract is visible; replace `name` with your application Effect.

```ts file="services.ts"
import { Context, Effect, Layer } from "effect";
import { html } from "@typed/template";

export class ProfileService extends Context.Service<ProfileService, {
  readonly name: Effect.Effect<string>;
}>()("ProfileService") {}

export const ProfileLive = Layer.succeed(ProfileService, { name: Effect.succeed("Ada") });
export const loadName = Effect.flatMap(ProfileService, (profile) => profile.name);
export const status = html`<p role="status">Account ready</p>`;
```

This component starts with a prefetched value and refreshes on demand. `useEffect` returns Vue refs and computed refs; no custom subscription watcher is required.

```tsx file="Profile.tsx"
import { defineComponent } from "vue";
import { Option } from "effect";
import * as AsyncData from "@typed/async-data";
import { useEffect } from "@typed/vue/Reactive";
import { loadName } from "./services.js";

export const Profile = defineComponent({
  props: { initialName: { type: String, required: true } },
  setup(props) {
    const profile = useEffect(loadName, {
      initial: AsyncData.success(props.initialName),
      immediate: false,
    });

    return () => (
      <section aria-busy={profile.pending.value}>
        <h2>Profile</h2>
        <p>{Option.getOrElse(profile.latest.value, () => "Loading…")}</p>
        {profile.failure.value && <p role="alert">Could not load the profile.</p>}
        <button onClick={() => profile.refresh()}>Refresh</button>
      </section>
    );
  },
});
```

| Input                         | Native Vue binding                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `Effect`, `Stream`, or `Fx`   | `useEffect`, `useStream`, or `useFx` from `@typed/vue/Reactive`                            |
| Effect service                | `useService(Service)`                                                                      |
| `RefSubject`                  | `useRefSubject(ref)` exposes a writable `current` computed ref and `set`/`update` commands |
| Existing `AsyncData` producer | `useAsyncDataSource(source)` from `@typed/vue/Reactive` flattens its state                 |
| Existing Vue `AsyncData` ref  | `useAsyncData(data)` from `@typed/vue/AsyncData` derives display state                     |

Sources and runtimes can be Vue refs or getters. Changing either interrupts the previous producer, waits for cleanup, and starts the replacement. Resource state includes the underlying `AsyncData`, current and latest values, full failure causes, pending/refreshing status, refresh, and cancellation. `latest` retains the last available value across subsequent failures. Use Typed's `AsyncData` operations for optimistic updates; the projections preserve the underlying optimistic state instead of inventing separate loading flags.

For shared writable state, expose a parent-owned `RefSubject` through a native computed ref:

```tsx
import { defineComponent, type PropType } from "vue";
import type * as RefSubject from "@typed/fx/RefSubject";
import * as AsyncData from "@typed/async-data";
import { useRefSubject } from "@typed/vue/Reactive";

export const Counter = defineComponent({
  props: {
    count: { type: Object as PropType<RefSubject.RefSubject<number>>, required: true },
    initialCount: { type: Number, required: true },
  },
  setup(props) {
    const value = useRefSubject(() => props.count, {
      initial: AsyncData.success(props.initialCount),
    });

    return () => (
      <button onClick={() => { value.current.value = (value.current.value ?? 0) + 1; }}>
        {value.current.value}
      </button>
    );
  },
});
```

The parent owns the RefSubject Scope. `set` and `update` return typed `Exit` results when callers need to handle write failures explicitly. `useAsyncDataSource` preserves incoming optimistic, refreshing, and failed states; inspect `AsyncData.isOptimistic(state.data.value)` when displaying a pending optimistic edit.

## Typed output inside Vue

Use the application runtime when the view needs services; a service-free view needs no provider. `Typed` reads the runtime from Vue injection, supplies its own template renderer and Scope, and supports reactive replacement of its `value` prop. Its host ID defaults to Vue’s native `useId`; an explicit `id` can override it.

```tsx file="App.tsx"
import { defineComponent } from "vue";
import { Typed } from "@typed/vue/Typed";
import { Profile } from "./Profile.js";
import { status } from "./services.js";

export const App = defineComponent({
  props: { initialName: { type: String, required: true } },
  setup(props) {
    return () => (
      <main>
        <Profile initialName={props.initialName} />
        <Typed value={status} onError={console.error} />
      </main>
    );
  },
});
```

`installRuntime(app, runtime)` supplies a borrowed `ManagedRuntime` to the whole app. During `setup`, `provideRuntime` creates a nested provider, `provideServices(Context.make(Service, implementation))` overrides selected services, and `useRuntime` reads the current runtime ref. `fromContext` adapts an already-built Effect Context without acquiring or owning resources. Typed-owned Vue views receive their ambient Effect services automatically.

## Server rendering and hydration

Create a runtime for each request. `Typed` renders its value during Vue's `onServerPrefetch`; it adopts that HTML when the client hydrates. Reactive composables normally also prefetch one source value on the server and subscribe after mount. An explicit `initial` snapshot is authoritative during SSR, so the server does not execute that source again. The profile above uses `immediate: false` because its value is explicitly prefetched and refresh is user-driven. `prefetch(source)` from `@typed/vue/Reactive` captures one Effect/Stream/Fx emission as `AsyncData` and closes the temporary Scope; use it when transferring the complete resource state rather than a success-only value.

```ts file="server.ts"
import { createSSRApp } from "vue";
import { renderToWebStream } from "vue/server-renderer";
import { ManagedRuntime } from "effect";
import { installRuntime } from "@typed/vue/Runtime";
import { App } from "./App.js";
import { loadName, ProfileLive } from "./services.js";

export async function renderApp(
  send: (body: ReadableStream<Uint8Array>, data: { readonly initialName: string }) => Promise<void>,
) {
  const runtime = ManagedRuntime.make(ProfileLive);

  try {
    const initialName = await runtime.runPromise(loadName);
    const app = createSSRApp(App, { initialName });
    installRuntime(app, runtime);

    await send(renderToWebStream(app), { initialName });
  } finally {
    await runtime.dispose();
  }
}
```

`send` is your response writer: it streams the body, transports `data` through the framework's request-data mechanism, and resolves after consuming or cancelling the stream. The runtime stays alive until then. Vue can send surrounding markup while a Typed child is pending; each Typed host collects its own body during `onServerPrefetch` before Vue emits that host. For static generation or an API requiring a string, use Vue's `renderToString(app)` inside the same request lifetime. Hydrate with the same initial value.

```ts file="browser.ts"
import { createSSRApp } from "vue";
import { ManagedRuntime } from "effect";
import { installRuntime } from "@typed/vue/Runtime";
import { App } from "./App.js";
import { ProfileLive } from "./services.js";

export function hydrateApp(target: Element, data: { readonly initialName: string }) {
  const runtime = ManagedRuntime.make(ProfileLive);
  const app = createSSRApp(App, data);
  installRuntime(app, runtime);
  app.mount(target);
  return async () => { app.unmount(); await runtime.dispose(); };
}
```

Use `createApp` for browser-only mounting. Use a request-specific `ServerRouter` when a view reads navigation, and initialize the browser runtime with the matching route. A server snapshot is request data; runtime instances and live subscriptions are rebuilt by their owner.

## Route handlers and navigation

`routeComponent` turns a Vue component into a Typed matcher handler. It keeps decoded route props reactive and carries the selected handler's services and `CurrentRoute` into the component and its descendants. A Vue application renders this route tree through `Typed`.

```tsx file="Routes.tsx"
import { defineComponent } from "vue";
import { html } from "@typed/template";
import { Typed } from "@typed/vue/Typed";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";
import { routeComponent, useNavigation } from "@typed/vue/Router";
import { PriceCard } from "./PriceCard.js";

const PriceRoute = defineComponent({
  props: { symbol: { type: String, required: true } },
  setup: (props) => () => <PriceCard symbol={props.symbol} last={42} />,
});
export const routes = Matcher.match(Route.Parse("/prices/:symbol"),
  routeComponent(PriceRoute),
).match(Route.Wildcard, html`<p>Choose a price.</p>`);

export const Routes = defineComponent({
  setup() {
    const navigation = useNavigation();

    return () => (
      <main>
        <button onClick={() => navigation.navigate("/prices/DEMO")}>Prices</button>
        <Typed value={routes} onError={console.error} />
      </main>
    );
  },
});
```

For this mixed route tree, provide `RandomValues`, the matching router backend, and application services. `Typed` supplies its native renderer; a Typed-owned route tree uses the standard renderer layer shown above. `useRoute(Route.Parse("/prices/:symbol"))` observes optional decoded params; `useMatcher(matcher)` observes data returned by a matcher. `useLocation` observes the destination, `useCurrentPath` its path, and `useCurrentRoute` the structural route owner. `provideCurrentRoute(tree)` overrides ancestry in a Vue layout.

`useRoute(route, { currentRoute: { route: Route.Parse("/admin") } })` uses that mount instead of the ambient one; `{ route: Route.Slash }` matches from `/`. The supplied mount is applied once. Its wildcard fallback returns `None` inside that mount, while leaving it reports the native `RouteNotFound` failure. Omitting `currentRoute` keeps the default global fallback, which remains live when leaving and reentering the ambient mount. The option also accepts a Vue ref or getter.

`Navigation` remains the source of truth for location, entries, transitions, and back/forward availability. Command results preserve Effect `Exit` so navigation failures can be handled explicitly.

## Test with the same provider

Use `TestRouter` and replacement services with the same app installation. No alternate component API is needed.

```ts file="Routes.test.ts"
import { expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { Effect, Layer, ManagedRuntime } from "effect";
import { TestRouter } from "@typed/router/RouterTest";
import { installRuntime } from "@typed/vue/Runtime";
import { ProfileService } from "./services.js";
import { Routes } from "./Routes.js";

it("renders with test services", async () => {
  const runtime = ManagedRuntime.make(Layer.mergeAll(
    Layer.succeed(ProfileService, { name: Effect.succeed("Test user") }),
    TestRouter({ url: "https://example.test/prices/DEMO" }),
  ));
  try {
    const app = createSSRApp(Routes);
    installRuntime(app, runtime);
    expect(await renderToString(app)).toContain("DEMO: 42");
  } finally {
    await runtime.dispose();
  }
});
```

## Configure event bubbling

`stopPropagation` is available in either rendering direction:

```tsx
import { view } from "@typed/vue";
import { Typed } from "@typed/vue/Typed";
import { PriceCard } from "./PriceCard.js";
import { status } from "./services.js";

export const card = view(PriceCard, { symbol: "DEMO", last: 42 }, {
  stopPropagation: { click: true },
});

export const statusNode = (
  <Typed value={status} stopPropagation={{ click: true, keydown: false }} />
);
```

Use `CurrentRootEvents` from `@typed/template/RootEvents` in the Effect context, or `provideServices(Context.make(CurrentRootEvents, policy))`, for an inherited policy. The default is normal bubbling. Undefined inherits, an object overrides event names, and `false` disables inherited blocking. `true` calls `stopPropagation` at the root after inner listeners run. Default actions and sibling root listeners remain available; ancestor capture listeners have already run. Listeners are removed when the owning Scope closes.

Automatic `div` hosts use `display: contents` to remove their layout boxes while remaining DOM ownership boundaries. Place them where an HTML `div` is valid; the style does not change table or SVG parsing rules. Vue owns each Vue subtree, Typed owns each Typed range, and unmount closes that child's Scope. Providers borrow runtimes; the application or request that created a runtime disposes it. Updating `stopPropagation` or `onError` preserves the current Typed rendering. Failed Typed work goes to `onError` when supplied, otherwise through Vue's component error path.

The native template ref initializes the framework root. Its mount callbacks can run before the surrounding Typed tree reaches its destination. Vue readiness and DOM attachment are separate: measure or focus only after the outer owner has placed the host. Raw `RenderEvent` consumers own placement themselves.
