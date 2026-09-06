# @typed/ui

> **Beta:** This package is in beta; APIs may change.

`@typed/ui` is the **web integration layer** for `@typed/router` and `@typed/template`. It bridges typed's routing and template system with the browser and Effect's HTTP stack.

## Capabilities

- **UI substrate** — `Dom` provides typed native host props, exact Effect/Fx channel preservation, user-first event composition, and hydration-aware ref composition. Stateful components use `RefSubject.hydrate` / `hydrateAll` directly; there is no parallel UI state abstraction.
- **Button** — A headless native `<button>` host with a safe `type="button"` default, reactive disabled state, typed click handling, caller props, and custom-host support.
- **Link** — A typed anchor component that intercepts same-origin clicks and navigates via `Navigation.navigate` instead of a full page reload. Keeps routing SPA-style while preserving normal `<a>` semantics (href, target, keyboard, right-click).
- **SSR** — `ssrForHttp` compiles a router Matcher into HttpRouter GET handlers for buffered server-side rendering. `streamingSsrForHttp` uses the same routing pipeline but streams HTML chunks as they are rendered. `handleHttpServerError` adds global middleware for 404/400/500.

## Dependencies

- `effect`
- `@typed/fx`
- `@typed/id`
- `@typed/navigation`
- `@typed/router`
- `@typed/template`

The Node HTTP platform and `happy-dom` are development dependencies used by the integration tests; browser consumers do not install them through `@typed/ui`.

## API overview

- **Button** — `Button.Button(options)` renders a native `<button>` and accepts `content`, `type`, `disabled`, `onclick`, standard button props, and an optional custom host.
- **Dom** — Typed host/ref/event composition shared by the UI components. Its host attributes target Baseline 2026 and include native popover and invoker-command attributes.
- **APG components** — Stateful controls use callable `RefSubject.hydrate` state on their owning host. `Alert` is a non-modal live region; `Meter`, `Slider`, and `SpinButton` use native HTML controls; `Switch` uses a button host; `WindowSplitter`, `Carousel`, `Tree`, `Grid`, and `TreeGrid` provide their APG keyboard and ARIA contracts without a portal or positioning runtime.
- **Link** — `Link(options)` renders an `<a href="...">` that intercepts same-origin, same-document clicks and calls `Navigation.navigate` instead of a full page load. Options include `href`, `content`, `replace`, and standard anchor props. Requires **Navigation** and **RenderTemplate** in context (e.g. browser router).
- **SSR:** `ssrForHttp(router, matcher)` — registers buffered route handlers on an Effect **HttpRouter**; `streamingSsrForHttp(router, matcher)` — same routing with streamed HTML output; `handleHttpServerError(router)` — global middleware for HTTP server errors.

## API reference

### APG component families

`Alert.Alert({ content })` renders `role="alert"` and never moves focus. Use `Dialog.Content` with `props: { role: "alertdialog" }` when a message must interrupt the user.

`Meter`, `Slider`, and `SpinButton` each take a hydratable `state` made by `makeState({ value })`; slider and spin button synchronize their native range/number input changes into that state. `Switch.makeState({ checked })` drives `Switch.Switch({ state, content })`.

`WindowSplitter.makeState({ value, min, max, step, orientation })` drives a focusable separator with APG arrow keys, Home/End, and Enter collapse/restore. Applications own pane sizing from its state.

`Carousel`, `Tree`, `Grid`, and `TreeGrid` each expose `makeState`, `makeCollection`, and structural parts. Their hydration state holds serializable selection/expansion state; their collections only register mounted DOM elements for navigation. `Tree.Group` and `TreeGrid.Group` define the nested collapsed DOM boundary; `Grid` and `TreeGrid` retain DOM focus on the root with `aria-activedescendant`.

### `Link`

Renders an `<a href="...">` that intercepts same-origin, same-document clicks and navigates via `Navigation.navigate` instead of a full page load. Requires **Navigation** and **RenderTemplate** in the Effect context (e.g. `BrowserRouter`).

```ts
function Link<const Opts extends LinkOptions>(
  options: Opts,
): Fx<
  RenderEvent,
  Renderable.ErrorFromObject<Opts>,
  Renderable.ServicesFromObject<Opts> | Scope | RenderTemplate
>;
```

**`LinkOptions`**

| Property  | Type                                                                                            | Required | Description                                                       |
| --------- | ----------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| `href`    | `Renderable<string, any, any>`                                                                  | Yes      | Target URL.                                                       |
| `content` | `Renderable<string \| number \| boolean \| null \| undefined \| void \| RenderEvent, any, any>` | Yes      | Link body (text or template content).                             |
| `replace` | `boolean`                                                                                       | No       | If `true`, use history replace instead of push. Default: `false`. |

In addition, `LinkOptions` accepts standard anchor event handlers (e.g. `onclick`), `ref`, and other writable `HTMLAnchorElement` properties. Custom `onclick` runs first; if the event is not `preventDefault`'d, the built-in navigation handler runs.

---

### `ssrForHttp`

Registers route handlers on an Effect **HttpRouter** for server-side rendering. The matcher's routes are compiled and each case is exposed as a GET route; requests are parsed, matched, and the corresponding Fx is rendered to HTML. Rendering is buffered: the complete HTML string is produced before the response begins. Requires **Router** and **Scope** to be provided elsewhere; other matcher services remain in the effect requirement. Matcher and render failures remain in Effect HTTP's request error channel so middleware can handle them.

Path captures are authoritative. If a request supplies the same name in the query string, the matched path value is passed to route decoding. The adapter initializes navigation state from Effect's request URL conversion, including the request host and `x-forwarded-proto`; deployments must only accept forwarding headers behind a trusted proxy.

**Overloads:**

```ts
// (router, matcher)
function ssrForHttp<E, R>(
  router: HttpRouter,
  input: Matcher<RenderEvent, E, R>,
): Effect.Effect<
  void,
  never,
  Exclude<R, Scope | Router> | HttpRouter.Request.From<"Error", E | HttpServerError>
>;

// (matcher)(router) — curried
function ssrForHttp<E, R>(
  input: Matcher<RenderEvent, E, R>,
): (
  router: HttpRouter,
) => Effect.Effect<
  void,
  never,
  Exclude<R, Scope | Router> | HttpRouter.Request.From<"Error", E | HttpServerError>
>;
```

- **`router`** — Effect `HttpRouter` to attach GET handlers to.
- **`input`** — A **Matcher** from `@typed/router` whose cases produce `RenderEvent` Fx (e.g. templates). Route path and query params are decoded and passed to the handler; `Scope` and `Router` are provided by the SSR pipeline.

---

### `streamingSsrForHttp`

Same routing and decoding behavior as `ssrForHttp`, but renders with `renderToHtml` and returns `HttpServerResponse.stream` so HTML chunks can be sent before rendering completes. Choose `ssrForHttp` when you need a fully buffered body (for example, middleware that inspects the complete HTML string) and `streamingSsrForHttp` when you want time-to-first-byte improvements.

**Overloads:** identical curried and uncurried shapes to `ssrForHttp`.

---

### `handleHttpServerError`

Adds global middleware to an **HttpRouter** that catches `HttpServerError` and returns appropriate HTTP responses:

| Error reason                      | Status |
| --------------------------------- | ------ |
| `RouteNotFound`                   | 404    |
| `RequestParseError`               | 400    |
| `InternalError` / `ResponseError` | 500    |

All four responses have empty bodies so request URLs, parse descriptions, service names, upstream response details, and other internal data are not reflected to clients. Non-`HttpServerError` failures are re-failed and remain visible in Effect HTTP's global error channel.

```ts
function handleHttpServerError(
  router: HttpRouter,
): Effect.Effect<
  void,
  never,
  import("effect/unstable/http/HttpRouter").Request<"GlobalError", unknown>
>;
```

Use after registering routes (e.g. after `ssrForHttp`) so unhandled route and parse errors are converted to 404/400/500 instead of failing the server.

## Example

```ts
import { Link } from "@typed/ui";
import { html } from "@typed/template";

// In a template: link that navigates via Navigation (no full reload)
const nav = html`<nav>
  ${Link({ href: "/", content: "Home" })} ${Link({ href: "/todos", content: "Todos" })}
</nav>`;
```

For SSR, provide the router and matcher to `ssrForHttp` or `streamingSsrForHttp` when setting up the HTTP server; see Effect's `HttpRouter` and `examples/fullstack/src/server.ts` for the workspace's server wiring.
