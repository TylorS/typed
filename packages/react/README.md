# @typed/react

Use React 19 components in Typed templates and Typed templates in React. Both directions support server rendering, real hydration, reactive updates, and scoped cleanup. Hosts are created automatically with `display: contents`; applications do not need wrapper markup.

## React in Typed

```tsx
import { useState } from "react";
import { Effect, Layer } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { view } from "@typed/react";

function Counter({ label }: { label: string }) {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {label}: {count}
    </button>
  );
}

const application = Fx.gen(function* () {
  const props = yield* RefSubject.make({ label: "Clicks" });

  return render(html`<main>${view(Counter, props, { id: "counter" })}</main>`, document.body);
}).pipe(Fx.drainLayer, Layer.provide(DomRenderTemplate));

const program = Layer.launch(application);
```

`view(Component, props, { id, ...options })` accepts a complete props object, `Effect`, `Stream`, or `Fx`. Use `Fx.struct` to combine reactive fields. Complete props retain their callback functions and nested React nodes. Producer errors and Effect service requirements remain in the returned Fx type. React exceptions become `ReactRenderError`.

The direct-node overload `view(node, { id })` also accepts any `ReactNode`, including text, arrays, fragments, null, and browser portals. A view creates one React root. Updates enter React state through a transition, preserving component state and DOM identity. A finite props source leaves the mounted tree alive until its render Scope closes. Scope closure interrupts subscriptions and calls React's `unmount`.

## Server rendering and hydration

```ts
import { HtmlRenderTemplate, renderToHtml, renderToHtmlString } from "@typed/template/Html";

const app = html`<main>${view(Counter, { label: "Clicks" }, { id: "counter" })}</main>`;
const chunks = renderToHtml(app).pipe(Fx.provide(HtmlRenderTemplate));

// Collect a complete string when needed, including static generation.
const markup = await Effect.runPromise(
  renderToHtmlString(app).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
);
```

Serve `markup`, then run the same `app` with `render(app, element)` inside a live Effect Scope. The existing Typed DOM or HTML renderer layer selects the React backend automatically. `view` adds no framework renderer layer or rendering entry point. Every view requires an `id` that is unique among independent roots and identical on the server and client. It becomes the native host id and the default React `identifierPrefix`; an explicit prefix override must also match. Typed's native template/ref pathway owns host construction and hydration matching. `onRecoverableError` forwards React's hydration diagnostics.

The server interpreter forwards React's readable stream through Effect Stream. Shell HTML and Suspense updates arrive incrementally; the native closing host event is marked final only after React finishes. Prefer Typed's `renderToHtml` when the response can consume chunks. Observe that Fx inside the request Scope; interruption aborts React and releases the stream reader. `renderToHtmlString` collects the same stream when a complete string is needed. Streaming responses include React's scripts for applying deferred Suspense content, which must run as part of normal HTML loading before hydration. DOM output publishes the native host while React commits asynchronously. Subsequent props updates wait for the first root commit and never call `root.render` on an incomplete hydration root.

`view` loads the matching React backend lazily from the native host's `DomRenderEvent` or `HtmlRenderEvent`. There is no separate React renderer service or layer to provide. DOM creation reads Typed's `CurrentRenderDocument` at render time, allowing alternate documents and DOM tests.

## Typed in React

```tsx
import { renderToReadableStream } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { Typed } from "@typed/react";
import { html } from "@typed/template";

const value = html`<p>${"Rendered by Typed"}</p>`;
const element = <Typed value={value} />;

// Server: React streams while Typed resolves through an internal Suspense boundary.
const stream = await renderToReadableStream(element);
const response = new Response(stream, { headers: { "Content-Type": "text/html; charset=utf-8" } });

// Browser: the same component hydrates the existing Typed nodes.
hydrateRoot(document.getElementById("app")!, element);
```

React's streaming server APIs and `react-dom/static`'s `prerender` await Typed's HTML automatically. React can stream surrounding content and Suspense fallbacks while each Typed host collects its own body. Use these asynchronous APIs for SSR and static generation; the synchronous `renderToString` API cannot wait for asynchronous Typed producers. For a complete string, await `stream.allReady` and collect the stream. There is no prepared-markup prop or renderer helper. Provide the same application data and services on the server and during hydration, as for other React components.

The package's `browser` and default export conditions select the inverse component automatically. Its server implementation owns an initial promise above an internal Suspense boundary; its browser implementation hydrates the opaque host directly, without replaying server producers. Requests never share a global markup cache. Completed and failed server renders close their Typed scopes. For request cancellation, pass the same `AbortSignal` to React's server API and the component's optional `signal` prop. React's DOM server API does not expose its request signal to descendant components. Client rendering and hydration both start directly through the native ref. Browser-side calls to React's server API require the server implementation, as with other separately compiled framework components.

The `value` prop can contain reactive Typed values. Those values update without remounting. Replacing `value` replaces its scoped rendering; unmounting releases subscriptions and event listeners. The optional `onError` receives full Effect causes, including producer errors, defects, and runtime-layer failures. Without a callback, failures become `TypedRenderError` at React's server error callback or nearest client Error Boundary. Ordinary unmount interruption is excluded.

`Typed` uses the nearest React Effect `Provider` by default and accepts an explicit caller-owned `runtime` override. Its React callback ref supplies `DomRenderTemplate` and owns the scoped native render; its SSR component supplies `HtmlRenderTemplate` and closes the finite scope. Replacements wait for asynchronous cleanup before mounting the next value. It never disposes a borrowed runtime. In a service-free tree no Provider or runtime is required. The inverse host uses React's `useId` unless you supply its `id` prop.

## Ownership boundaries

Each React island has an automatically generated native Typed host with an opaque React-owned interior. Hydration markers and DOM ownership remain separate, including equal sibling islands and suspended trees. These hosts have `display: contents`; they create real DOM elements but no layout boxes. Keep islands in HTML flow positions where those elements are valid, not directly inside table/select structures requiring specific child elements.

Components rendered by `view` inherit the running Effect context through React's Provider. This also makes substituted services available in tests. React hook requirements are ambient; missing services report an Effect cause or React rendering error at the relevant boundary.

## Effect services and reactive hooks

```tsx
import { Provider, useService, useEffect as useTypedEffect } from "@typed/react";
import { Context, Effect } from "effect";
import { Option } from "effect";

class Greeting extends Context.Service<Greeting, { readonly text: string }>()("Greeting") {}
const loadCount = Effect.succeed(42);

function Dashboard() {
  const greeting = useService(Greeting);
  const count = useTypedEffect(loadCount);

  return (
    <p>
      {greeting.text}: {Option.getOrElse(count.value, () => 0)}
    </p>
  );
}

const app = (
  <Provider context={Context.make(Greeting, { text: "Hello" })}>
    <Dashboard />
  </Provider>
);
```

`Provider` accepts already-built `context`, a borrowed `runtime`, or a `layer` it owns. Borrowed runtimes acquire services through Suspense, including streaming SSR and hydration, without a manual preparation step. A prepared context supports synchronous SSR. An owned layer is acquired after commit and disposed on unmount; use a caller-owned runtime when service acquisition must happen during SSR, and dispose it at the end of the request. An unprepared borrowed runtime shows `fallback` while its services load. `onError` receives layer failures. `serviceContext(tag)` creates a service-specific Provider and hook pair. Nesting a context overlays its services on the parent.

`useEffect`, `useStream`, and `useFx` observe their source after commit and interrupt it on unmount or replacement. Keep source identities stable with React's `useMemo` when constructing them during render. Each hook returns Typed `AsyncData`, optional `value`/`latest`/`error`/`cause`, status flags, and `refresh`/`cancel`. `useRefSubject` adds `set` and `update`; `useAction` provides event-driven `run(...args)`. Commands return typed `Exit` values and newer actions interrupt older ones. Action refresh repeats the latest call with its latest function and arguments, retaining the previous successful value while it runs.

`useAsyncData` consumes an Fx that already emits Typed `AsyncData`, preserving its refreshing and failure states. The `AsyncData` React component renders values, full failure causes, loading, and no-data branches. `prefetch(source)` captures a first value into `AsyncData` for the hooks' `initial` option, including an unchanged value when the source emits it. Supply the same initial snapshot for SSR and hydration; hooks do not execute sources during server rendering.

```tsx
import { prefetch, useEffect as useTypedEffect } from "@typed/react";

const initial = await Effect.runPromise(prefetch(loadCount));
// Pass initial as serialized application data to both server and client:
function Count({ initial }: { initial: import("@typed/async-data").AsyncData<number> }) {
  const state = useTypedEffect(loadCount, { initial });

  return <span>{Option.getOrElse(state.value, () => 0)}</span>;
}
```

## Typed routing and tests

`routeComponent(Component, { id: "route-profile" })` adapts a React component to a Typed route matcher. Its props come from the matcher's reactive params, and it receives route-local Effect services through the same automatic Provider. `useCurrentRoute` reads the structural `CurrentRoute` tree; `useNavigation` returns the shared navigation service; `useLocation` observes the current destination. Use `useAction` to run navigation commands.

`useRoute(route)` matches beneath the ambient `CurrentRoute` and keeps a live `None` fallback when navigation leaves that mount. Pass `useRoute(route, { currentRoute: { route: mount, parent } })` to replace the ambient mount with an explicit `CurrentRouteTree`. The supplied root is applied once. Unmatched paths inside it produce `None`; paths outside it produce Typed's `RouteNotFound`. Changing the option replaces the hook's matcher subscription. The supplied `parent` retains its structural ancestry and does not add another path prefix.

Testing uses these same boundaries. Provide `Context.make(Service, fake)` or a caller-owned ManagedRuntime built from test layers, including Typed's `TestRouter`. Server tests can render without any `document`; DOM tests can override `CurrentRenderDocument`. No test-only React runtime is required.

## Event bubbling at automatic hosts

Events bubble normally by default. Set a per-event policy when embedding either direction:

```tsx
view(Counter, { label: "Clicks" }, { id: "counter", stopPropagation: { click: true } });

const content = (
  <Typed value={value} onError={console.error} stopPropagation={{ click: true, keydown: false }} />
);
```

Set Typed's `CurrentRootEvents` service in the surrounding Effect context or React Provider to supply a default policy. Omitted options inherit it; an object overrides individual event names; `false` disables the inherited policy for that host. `Typed` accepts policy prop changes without replacing its child nodes. Listeners use bubbling `stopPropagation`: inner handlers still run, default actions remain available, and unspecified events remain transparent. The owning scope removes listeners during cleanup. Server markup is unchanged.

Typed's native render queue and React's commits have independent timing. A host event does not promise that React has committed, and initial React layout effects may run before the surrounding Typed template reaches its final destination. Observe readiness through React effects, and perform measurements or focus after the destination is attached. Keep the native render observation alive to receive later React failures; `Fx.take(1)` stops observing after the host event. The Effect Scope owns the mounted root until cleanup.
