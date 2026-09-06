# @typed/vue

Vue components inside Typed, and Typed views inside Vue. Rendering owns subscriptions and cleanup through Effect scopes. Hosts are created automatically and use `display: contents`.

```sh
pnpm add @typed/vue @typed/template @typed/fx effect vue
```

## Vue inside Typed

Vue components can use TSX or single-file templates. The TSX examples use Vue's JSX transform, such as `@vitejs/plugin-vue-jsx` in Vite, with `"jsx": "preserve"` and `"jsxImportSource": "vue"` in TypeScript. See [Vue's TSX setup](https://vuejs.org/guide/extras/render-function#jsx-type-inference).

```tsx
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import { html } from "@typed/template/RenderTemplate";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { view } from "@typed/vue/view";
import * as Layer from "effect/Layer";
import { defineComponent, ref } from "vue";

const Counter = defineComponent({
  props: { label: { type: String, required: true } },
  setup(props) {
    const count = ref(0);

    return () => (
      <button onClick={() => count.value++}>
        {props.label}: {count.value}
      </button>
    );
  },
});

const application = Fx.gen(function* () {
  const props = yield* RefSubject.make({ label: "Count" });

  return render(html`<main>${view(Counter, props, { id: "counter" })}</main>`, document.body);
}).pipe(Fx.drainLayer, Layer.provide(DomRenderTemplate));

const program = Layer.launch(application);
```

`view` selects Vue's backend from the native template output. Use Typed's ordinary `DomRenderTemplate` provider and keep the Effect scope open for the lifetime of the page. For an iframe or alternate document, use `DomRenderTemplate.using(target.ownerDocument)`. No Vue-specific renderer or layer is needed.

`view(component, props, options)` accepts a props object, `Effect`, `Stream`, or `Fx`. These are whole props snapshots; callbacks and other objects inside props are preserved. Component props remain checked by TypeScript. Supply a page-unique `options.id` and reuse it during hydration; Vue also uses it as the default `app.config.idPrefix`, keeping generated component IDs distinct across islands. The DOM interpreter creates one Vue app and updates a `shallowRef`, preserving the component instance and local state. Completing a props producer leaves its UI mounted until the rendering scope closes. Closing the scope unmounts Vue and stops subscriptions.

`options.configureApp(app)` runs on each new app before mount, hydration, or server rendering. Install plugins and `app.provide` values there. The app also receives the enclosing Typed Effect context automatically, so Vue's Typed runtime and service composables work without a second runtime. Vue failures enter the `VueError` channel; props failures retain their own type. A configured Vue error handler also receives errors.

The ordinary native ref supplies Vue's host. Vue initializes before its first DOM output is published; a newly created host can still be detached when `onMounted` runs. DOM placement follows Typed's normal rendering lifecycle, so measurements and focus that require connection should run after the native render publishes. Matching hydrated hosts are already in place. Detached rendering destinations also work.

## Server rendering and hydration

```ts
import { HtmlRenderTemplate, renderToHtml } from "@typed/template/Html";
import * as Effect from "effect/Effect";

const chunks = renderToHtml(page).pipe(Fx.provide(HtmlRenderTemplate));

await Fx.observe(chunks, (chunk) => Effect.promise(() => writeChunk(chunk))).pipe(
  Effect.scoped,
  Effect.runPromise,
);
```

Prefer `renderToHtml` when the response transport can accept chunks; `writeChunk` above is the transport's asynchronous writer. The native HTML provider selects Vue's `renderToWebStream` backend, and the surrounding Effect scope owns the response lifetime. SSR takes the first props snapshot and streams Vue's output in tree order: markup before an async descendant can arrive while its server prefetch is pending. Later siblings wait for that descendant; Vue does not stream Suspense fallbacks or out-of-order replacement scripts. Use `renderToHtmlString(page)` from the same module when a complete string is required.

Each render creates a fresh Vue app and SSR context. Native `render` hydrates matching server hosts with `createSSRApp`; it preserves server node identity, including neighboring islands. Use the same components, props, IDs, plugins, and service state on the server and client. Provide native `StaticHtmlRenderTemplate` for build-time output without Typed hydration markers.

`view(Component, props, { id, onSSRContext(context) {} })` delivers Vue's SSR context after successful rendering and waits for the callback before closing the host. Forward `context.teleports` to their matching dedicated target containers in the response before client hydration. Vue has no standard head-output channel; use a head plugin configured per app/request and follow that plugin's SSR API. The integration does not inject teleports or arbitrary head HTML automatically.

The native template creates the host and supplies its ref in the browser. Server output streams through its child interpolation; Typed owns escaping, chunk ordering, and surrounding hydration markers. Each backend is loaded lazily. The public `/view` module exposes `view`, its props/options types, and `VueError`. Importing it or the root entrypoint requires no global `document`. Consumer cancellation cancels the readable stream and closes the Typed rendering scope. Vue's native stream cancellation suppresses subsequent chunks but cannot abort application promises or pending server prefetch; the integration stops forwarding output and does not start the completion callback after cancellation.

## Typed inside Vue

```tsx
import { defineComponent } from "vue";
import { html } from "@typed/template/RenderTemplate";
import { Typed } from "@typed/vue/Typed";

export default defineComponent({
  setup() {
    const value = html`<strong>Rendered by Typed</strong>`;

    return () => <Typed value={value} />;
  },
});
```

Service-free Typed views work in ordinary Vue apps without a provider. Use Vue's `createApp` for client rendering, or `renderToWebStream(createSSRApp(App))` and `createSSRApp(App).mount(root)` for streamed SSR and hydration. Use Vue's `renderToString` when a complete string is required. Nested Vue-in-Typed-in-Vue views select the correct backend automatically.

Inside a `view` island, `Typed` receives the enclosing Effect context automatically. For application services in a standalone Vue app, use `installRuntime(app, runtime)` from `/Runtime`, `provideServices(context)` during setup, or `createTypedComponent(runtime)` from `/Typed`. A supplied runtime remains owned by the caller; create one per application/request and dispose it at that boundary.

`Typed` owns an automatic host with a Vue `useId` identity (or the supplied `id` prop) and hydrates its existing nodes after Vue mounts. Its opaque slot body needs a complete HTML snapshot during `onServerPrefetch`; the surrounding Vue tree can stream up to that slot while it is pending. The component provides the ordinary Typed DOM or HTML renderer through Vue's lifecycle. Updating the `value` prop or injected runtime aborts the previous render and waits for its finalizers before starting the next. Unmount stops rendering without disposing the shared runtime. Failures go to Vue's error boundary, or to the optional `onCause` callback with their complete Effect cause.

## Effect state and services in Vue

```ts
import { useEffect, useRefSubject, useService } from "@typed/vue/Reactive";
import { provideServices } from "@typed/vue/Runtime";
import * as Option from "effect/Option";

// Service-free sources need no provider. Application services come from
// the enclosing Typed island, provideServices, or an installed runtime.
const user = useEffect(loadUser);
const count = useRefSubject(counter);
const api = useService(Api);

// Render user.pending.value, Option.getOrUndefined(user.latest.value),
// or the typed failure from user.error.value. Retry with user.refresh().
// Vue v-model can bind count.current; count.set/update return an Effect Exit.
```

`useEffect`, `useStream`, and `useFx` accept a source or reactive source getter and return an `AsyncState`: the original `@typed/async-data` value, computed value/latest/error/cause/loading projections, and `refresh`/`cancel`. Sources and injected runtimes can change; old subscriptions are interrupted and finalized before their replacements start. Vue scope disposal cancels subscriptions and writes. `useAsyncData` derives the same projections from existing AsyncData state without subscribing again; `useAsyncDataSource` observes a reactive AsyncData producer.

Server prefetch takes the first source value. For matching initial client hydration, obtain `prefetch(source)` on the server and pass the resulting request-local AsyncData snapshot as `initial` to the client composable. Transfer application data using the application's existing serialization policy; the integration does not serialize services. `immediate: false` opts out of automatic execution.

`provideServices(context)` shadows selected Effect services for the current Vue component and descendants while retaining other runtime services. `provideRuntime(runtime)` replaces the execution provider. Both accept reactive values. A borrowed runtime needs `runFork` and `runPromiseExit`; `ManagedRuntime` already satisfies that contract. Explicit composable `{ runtime }` options work in a Vue `effectScope`, including tests, and retain service and runtime-error types. Vue's native injection cannot statically verify the services supplied by an ancestor.

## Routing and navigation

`/Router` exposes `useNavigation`, `useLocation`, `useCurrentRoute`, `provideCurrentRoute`, and `useRoute`. These use Typed's actual `Navigation`, `CurrentRoute`, and matcher services. `useNavigation` observes entries and transitions and exposes scoped `navigate`, `back`, `forward`, and `updateCurrentEntry` actions. Browser, server, and test behavior comes from the supplied `BrowserRouter`, `ServerRouter`, or `TestRouter` layer.

`routeComponent(Component, { id })` supplies a Typed matcher handler that renders the component with reactive decoded route props. Render that matcher through `Typed` so selected route dependencies and `CurrentRoute` remain owned by the rendering scope. `useMatcher(matcher)` observes other matcher output; `useRoute(route)` observes decoded route parameters under the inherited structural mount and returns `Option.none()` for an unmatched location. `useRoute(route, { currentRoute })` replaces that mount with an explicit `CurrentRouteTree`, applied once. The explicit root accepts a plain value, Vue ref, or getter; changing it replaces the matcher. Unmatched paths inside that root yield `Option.none()`, while paths outside it report the native `RouteNotFound` failure. A root is structural context, not the live location. For deterministic tests, provide a `ManagedRuntime` backed by `TestRouter` and close the Vue effect scope before disposing that runtime.

```ts
import { shallowRef } from "vue";
import { Parse } from "@typed/router/Route";
import type { CurrentRouteTree } from "@typed/router/CurrentRoute";
import { useRoute } from "@typed/vue/Router";

const currentRoute = shallowRef<CurrentRouteTree>({ route: Parse("/workspace") });
const user = useRoute(Parse("/users/:id"), { currentRoute });
// /workspace/users/42 => Some({ id: "42" })
// /workspace/other => None; /other => RouteNotFound
currentRoute.value = { route: Parse("/account") };
```

## Event boundaries

```tsx
view(Counter, props, { id: "counter", stopPropagation: { click: true, input: false } });

const content = <Typed value={value} stopPropagation={{ click: true }} />;
```

Selected events stop bubbling at the automatic host, after handlers inside the island have run. Defaults, including form behavior, remain unchanged. Other events continue normally. `CurrentRootEvents` from `@typed/template/RootEvents` supplies a contextual default; omitted options inherit it, individual `false` entries allow an inherited blocked event, and `stopPropagation: false` disables the boundary. Listeners are removed when the render/Vue scope closes. Changing a `Typed` component's policy preserves its rendered nodes.

## Rendering boundaries

The generated HTML hosts belong in normal HTML flow. Place a wrapper in valid HTML before embedding inside parser-sensitive structures such as tables, selects, or SVG. Neither renderer promises to adopt arbitrary unmarked HTML. Vue owns its island interior; Typed owns its separate surrounding range. Vue plugins and application state must be configured per request to avoid shared mutable server state.

## Validation

`pnpm --filter @typed/vue test` runs server tests, real Chromium integration tests, and public contract/type checks. Browser tests cover preserved component state, server-node hydration identity, sibling islands, failures, cancellation, replacement cleanup, and both embedding directions.
