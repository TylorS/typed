# @typed/svelte

Svelte 5 components inside Typed templates, and Typed renderables inside Svelte. Both directions create their own `display: contents` hosts, preserve SSR node identity during hydration, and release subscriptions with their rendering scope. The caller keeps ownership of its runtime.

## Svelte in Typed

```ts
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template/RenderTemplate";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { view } from "@typed/svelte";
import { Layer } from "effect";
import Counter from "./Counter.svelte";

const application = Fx.gen(function* () {
  const props = yield* RefSubject.make({ label: "Count" });
  const content = html`<main>${view(Counter, props, { id: "counter" })}</main>`;

  return render(content, document.body);
}).pipe(Fx.drainLayer, Layer.provide(DomRenderTemplate));

const program = Layer.launch(application);
```

`view(component, props, { id, ...options })` accepts a props object, `Effect`, `Stream`, or `Fx` (including `RefSubject`). Component props determine the required shape; the source's errors and required services remain in the returned `Fx`. It mounts once and updates a Svelte store, preserving component state. Once the first render event is published, the ambient Scope keeps the component live even if a consumer takes only that event. Cancellation before the first output releases pending acquisition. Nested published islands remain owned by their rendering Scope even when a sibling prevents the parent from publishing. A finite props source leaves the component mounted until cleanup. `context`, `intro`, `outro`, `recover`, `idPrefix`, `csp`, and `transformError` forward to the corresponding Svelte API.

Typed supplies the host through a native element ref. Svelte mounts at that ref and schedules its own commit. For a nested island, refs can run before Typed places the surrounding parent; `onMount` is not a guarantee that the parent is attached. The first Typed output describes the host, and subsequent props update the same component.

`view` selects its backend from the native `DomRenderEvent` or `HtmlRenderEvent` produced by its host template. Supply Typed's ordinary `DomRenderTemplate`, `HtmlRenderTemplate`, or `StaticHtmlRenderTemplate` and Scope at the application render boundary. No Svelte renderer layer or service is required. Both backends expose the current Effect context to the Svelte component, so native context and reactive helpers can read application services, navigation, and the current route without creating another runtime. Explicit Svelte `context` entries override inherited entries.

## Server rendering and hydration

```ts
import { view } from "@typed/svelte";
import { Fx } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtml, renderToHtmlString } from "@typed/template/Html";
import { Effect } from "effect";

const page = view(Counter, { label: "Count" }, { id: "counter" });
const chunks = renderToHtml(page).pipe(Fx.provide(HtmlRenderTemplate));

// Collect a complete string when needed, including static generation.
const body = await Effect.runPromise(
  renderToHtmlString(page).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
);
```

Prefer `renderToHtml` when the response can consume chunks. The application observes that Fx within its request Scope, supplies the native HTML renderer, and closes the scope when the response completes or is interrupted. Use `StaticHtmlRenderTemplate` for static generation without Typed hydration markers.

The surrounding Typed template and Svelte host stream before the component is ready. Svelte's public server renderer returns a complete `body` and `head`, so the component body arrives together after its first props value and asynchronous rendering finish. Application service requirements and source errors stay in the Effect type. `onHead` is optional and receives application `<svelte:head>` output; omit it when the component has no head content.

On the client, pass the same Typed template and its server root to `render`. Hydration is automatic. Typed creates an ordinary `div` host through its native template path. The host template has no child parts. The HTML backend includes Svelte's serialized body inside that host, and Svelte owns those children during hydration. Client and server need matching initial props, component structure, and the same required `id`. Supply nonempty, deterministic ids unique across the page; the id also defaults Svelte's server `idPrefix`.

`@typed/svelte` and `@typed/svelte/Typed.svelte` import in Node without `document` or a `.svelte` loader. The package publishes separate compiled client and server components selected through native package conditions. Application Svelte components use their normal Svelte compilation.

## Typed in Svelte

```svelte
<script lang="ts">
  import Typed from "@typed/svelte/Typed.svelte";
  import { html } from "@typed/template/RenderTemplate";
  import { Effect } from "effect";

  let { count } = $props();
  const content = html`<button onclick=${Effect.sync(() => console.log("clicked"))}>
    ${count}
  </button>`;
</script>

<Typed view={content} />
```

`Typed` accepts any Typed `Renderable` as its `view`, including primitive values, templates, `Effect`, `Stream`, and `Fx`. Its automatically created `div` host has `display: contents`. The optional `id` prop defaults to Svelte's `$props.id()`, stable across SSR and hydration. Views without application services need no runtime. The optional `runtime` prop or nearest `provideRuntime` context supplies application services when needed. Runtime changes or view replacements close the previous rendering scope before starting the next.

Use Svelte's own APIs for SSR, static generation, and hydration:

```ts
// Server or static build
import { render } from "svelte/server";
const { head, body } = await render(App, { props: { count: 0 } });

// Browser, with that HTML already in target
import { hydrate } from "svelte";
const app = hydrate(App, { target, props: { count: 0 } });
```

The component supplies `HtmlRenderTemplate` and Scope during native Svelte SSR, then supplies `DomRenderTemplate` through its Svelte attachment in the browser. It awaits Typed's HTML rendering. Each response closes its observation scope while leaving a supplied runtime owned by the caller. Svelte retains the server HTML at the opaque boundary, and Typed hydrates its original nodes. Client-only `mount` starts the live view normally. No manually prepared HTML or integration rendering helper is needed. The package compiles its asynchronous component, so consumers do not need to enable Svelte's experimental async compiler option. As with other asynchronous Svelte components, use `await render(...)` on the server.

`onReady` fires after the first Typed output attaches; `onError` receives typed failures or renderer defects as an Effect `Cause`. Without `onError`, the host dispatches `typed:error`. Normal interruption is silent. Updating these callbacks or `stopPropagation` preserves the current Typed render; replacing `runtime` or `view` closes and replaces it. Component cleanup never calls `runtime.dispose()`.

For an existing element, the lower-level `attachment(runtime, view, options?)` from `@typed/svelte/Attachment` works with Svelte's `{@attach}` syntax. The component is the usual choice when you want automatic hosting and SSR.

## Stores, services, and routes

- `toReadable(fx, initial)` returns an Effect acquiring a readable Svelte store in the current Scope.
- `toWritable(ref)` returns an Effect acquiring a writable store backed by a `RefSubject`. Svelte writes publish synchronously and use the captured Effect context. Writes stop after scope closure.
- `fromReadable(store)` returns an `Fx` that subscribes when observed and unsubscribes on interruption.
- These store conversions accept non-failing sources because Svelte stores have no error channel. `useSource` and `useAsyncData` expose failures and pending states through Typed's `AsyncData` model.
- `provideRuntime`, `provideServices`, `useRuntime`, and `useService` use Svelte context and borrowed runtime facades. Reactive runtime stores propagate provider replacements.
- `useSource`, `useAsyncData`, and `useRefSubject` own work for the Svelte component lifetime. Server rendering reads the provided `initial` snapshot; browser observation starts after mount.
- `useRefSubject(ref, initial)` accepts failing refs, including hydrated state. Its native writable `set` and `update` methods return `Promise<Exit>` and use the RefSubject's serialized transactions. Read and write failures remain visible in `.state` when native bindings ignore those results. Runtime replacement and unmount interrupt pending writes.
- `useNavigation`, `useLocation`, `useCurrentPath`, `useCurrentRoute`, `useRoute`, and `provideCurrentRoute` use Typed's actual Navigation, Matcher, decoded params, and structural CurrentRoute services.

`useRoute(route, { currentRoute })` accepts a `CurrentRouteTree` or native Svelte readable store. Omission matches relative to the ambient mount and returns `None` outside it. An explicit tree replaces that mount and applies its prefix once; unmatched paths inside it return `None`, while paths outside it retain Typed's `RouteNotFound` failure. Updating the root store restarts observation with the new context. `provideCurrentRoute` continues to set the structural context inherited by descendants.

The capabilities are also available through `/Runtime`, `/Reactive`, `/AsyncData`, `/Router`, and `/Store` subpaths. Tests can provide the same Effect service layers, `TestRouter`, or an injected render document used by application code.

The hosts are ordinary HTML `div` elements. Place islands in normal HTML content; parser-sensitive table children and SVG children require an appropriate surrounding HTML element. This package targets Svelte 5.57 or newer.

## Event propagation at roots

Events bubble normally by default. Set `stopPropagation` on `view` options, `<Typed>`, or `attachment` options to select native event names:

```ts
view(Counter, props, { id: "counter", stopPropagation: { click: true, keydown: false } });
```

A `true` entry stops that event when it reaches the automatic host. A `false` entry allows it, overriding an inherited setting. Set the entire option to `false` to disable the inherited policy; omit it to inherit `CurrentRootEvents` from `@typed/template/RootEvents`. The reference defaults to `false` and can be provided with normal Effect service layers, including test layers.

The listener runs during bubbling, so component handlers still work. It does not call `preventDefault`, use capture listeners, or stop other handlers on the same root. Ancestor capture listeners have already run; non-bubbling events do not reach this listener. This is a per-event propagation choice, not complete event isolation. Root listeners are scoped to the host and removed on cleanup; `<Typed>` also replaces them when its policy changes.

`prefetch(source)` from `/Reactive` samples a value, Effect, Stream, or Fx into an `AsyncData` snapshot in a fresh request scope. Run it through the request runtime, then pass the result as `initial` to `useSource` for matching SSR and hydration. Source failures become failure snapshots; an empty source becomes `NoData`. Use the same helpers with `TestRouter`, injected services, or a test document to exercise server, browser, and test environments.

## Checking Svelte files

Run `pnpm --filter @typed/svelte check:svelte` to check the package's `.svelte` components, test fixtures, and TypeScript files. `build`, `build:components`, and `test:types` include this check and fail on errors or warnings.

Each check recreates the generated `.svelte-check` files so deleted or renamed components cannot leave stale diagnostics.

`svelte.config.js` supplies the asynchronous compiler option to the editor, Vite, and the component build. Keep compiler options there so these environments agree. The checker uses TypeScript 7 through `--tsgo`; the TypeScript 6 dependency supplies the JavaScript compiler API that Svelte's tooling also requires.
