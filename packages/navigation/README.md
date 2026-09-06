# @typed/navigation

> **Beta:** This package is in beta; APIs may change.

`@typed/navigation` provides typed, Effect-based control over the browser history API and in-memory history. It solves the need for reactive navigation state (current entry, history stack, transition, canGoBack/canGoForward), programmatic actions (navigate, back, forward, reload), and lifecycle hooks (before/after navigation) that can intercept, redirect, or cancel. Use it when you need: browser navigation with full history control; in-memory history for tests or SSR; blocking navigation on unsaved changes (confirm/cancel/redirect). The router (`@typed/router`) builds on navigation: `BrowserRouter` uses browser history, `ServerRouter` and `TestRouter` use in-memory providers.

## Integration

- **@typed/router** — `Router` = `CurrentRoute | Navigation`; BrowserRouter uses `fromWindow`; ServerRouter and TestRouter use `memory` or `initialMemory` for tests and SSR
- **@typed/ui** — Link component for programmatic navigation; HttpRouter uses `initialMemory` for server-side request handling

## Dependencies

- `effect`
- `@typed/fx`
- `@typed/id`

## API overview

- **Navigation** (service) — `origin`, `base`; reactive: `currentEntry`, `entries`, `transition`, `canGoBack`, `canGoForward`; actions: `navigate`, `back`, `forward`, `traverseTo`, `updateCurrentEntry`, `reload`; hooks: `onBeforeNavigation`, `onNavigation`.
- **Layers / providers:** `fromWindow` (browser history), `memory`, `initialMemory` (in-memory for tests or SSR).
- **Model types:** `Destination`, `NavigationEvent`, `BeforeNavigationEvent`, `Transition`, `NavigationError`, `RedirectError`, `CancelNavigation`, etc.; see `model`.
- **Blocking** — utilities for blocking navigation (e.g. unsaved changes).

## In-memory example

```ts
import { Ids } from "@typed/id";
import { Navigation, initialMemory } from "@typed/navigation";
import { Effect, Layer, Option } from "effect";

const NavigationLive = initialMemory({ url: "https://example.com/" }).pipe(
  Layer.provide(Ids.Default),
);

const program = Effect.scoped(
  Effect.gen(function* () {
    const navigation = yield* Navigation;

    // Registrations live until this Scope closes.
    yield* navigation.onBeforeNavigation(() => Effect.succeed(Option.none()));
    yield* navigation.onNavigation((event) =>
      Effect.succeed(Option.some(Effect.log(`committed ${event.destination.url.pathname}`))),
    );

    yield* navigation.navigate("/about", { history: "push" });
  }),
);

await Effect.runPromise(program.pipe(Effect.provide(NavigationLive)));
```

`memory`, `initialMemory`, and `fromWindow` require `Ids`. Provide `Ids.Default` for application code or `IdsTest()` from `@typed/id/IdsTest` for deterministic tests. Hook registration requires `Scope.Scope`; `Effect.scoped` gives registrations an explicit lifetime instead of leaking them beyond the program that owns them.

For browser history, use the same ownership pattern with `fromWindow()`:

```ts
import { Ids } from "@typed/id";
import { fromWindow } from "@typed/navigation";
import { Layer } from "effect";

const BrowserNavigation = fromWindow().pipe(Layer.provide(Ids.Default));
```

## API reference

### Navigation (service)

Effect service for browser or in-memory history. Access via `yield* Navigation` inside an Effect that has a Navigation layer provided.

| Member                          | Type                                              | Description                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `origin`                        | `string`                                          | Current origin (e.g. `"https://example.com"`).                                                                                                                                          |
| `base`                          | `string`                                          | Route-path prefix from `<base href>` (pathname only, including its trailing slash), or `"/"`.                                                                                           |
| `currentEntry`                  | `RefSubject.Computed<Destination>`                | Reactive current history entry.                                                                                                                                                         |
| `entries`                       | `RefSubject.Computed<ReadonlyArray<Destination>>` | Reactive list of all history entries.                                                                                                                                                   |
| `transition`                    | `RefSubject.Filtered<Transition>`                 | Emits the in-progress transition when navigating.                                                                                                                                       |
| `canGoBack`                     | `RefSubject.Computed<boolean>`                    | Whether `back()` can be called.                                                                                                                                                         |
| `canGoForward`                  | `RefSubject.Computed<boolean>`                    | Whether `forward()` can be called.                                                                                                                                                      |
| `navigate(url, options?)`       | `Effect<Destination, NavigationError>`            | Navigate to `url`; `options.history`: `"push"` \| `"replace"` \| `"auto"`, `state`, `info`. With `"auto"`, equal origin and pathname replaces; query and hash do not affect the choice. |
| `back(options?)`                | `Effect<Destination, NavigationError>`            | Go back one entry; `options.info` optional.                                                                                                                                             |
| `forward(options?)`             | `Effect<Destination, NavigationError>`            | Go forward one entry; `options.info` optional.                                                                                                                                          |
| `traverseTo(key, options?)`     | `Effect<Destination, NavigationError>`            | Go to the entry with the given `key`; `options.info` optional.                                                                                                                          |
| `updateCurrentEntry({ state })` | `Effect<Destination, NavigationError>`            | Update the current entry’s `state` (replace in place).                                                                                                                                  |
| `reload(options?)`              | `Effect<Destination, NavigationError>`            | Reload current entry; `options.info`, `options.state` optional.                                                                                                                         |
| `onBeforeNavigation(handler)`   | `Effect<void, never, R \| R2 \| Scope>`           | Register a before-navigation handler; can redirect or cancel.                                                                                                                           |
| `onNavigation(handler)`         | `Effect<void, never, R \| R2 \| Scope>`           | Register a handler that runs after navigation commits.                                                                                                                                  |

### CurrentPath

`RefSubject.Computed<string>` — reactive current pathname + search (e.g. `"/about?tab=1"`). Built from `Navigation.currentEntry`.

### Layers

| Layer                    | Description                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `fromWindow(window?)`    | Uses the browser `Window` history API. Defaults to `globalThis.window`. Requires `Ids` in context.                         |
| `memory(options)`        | In-memory history from `MemoryOptions`: `entries`, `origin?`, `base?`, `currentIndex?`, `maxEntries?`, `commit?`.          |
| `initialMemory(options)` | In-memory history with a single initial entry. `InitialMemoryOptions`: `url`, `origin?`, `base?`, `maxEntries?`, `state?`. |

### Blocking (unsaved changes, etc.)

| Export                        | Type                                                       | Description                                                                                        |
| ----------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `useBlockNavigation(params?)` | `Effect<BlockNavigation, never, Navigation \| R \| Scope>` | When navigation is attempted, can block and show confirm/cancel/redirect.                          |
| `BlockNavigation`             | interface                                                  | Extends `RefSubject.Filtered<Blocking>`; has `isBlocking: RefSubject.Computed<boolean>`.           |
| `Blocking`                    | interface                                                  | Extends `BeforeNavigationEvent`; has `cancel`, `confirm`, `redirect(urlOrPath, options?)` effects. |
| `UseBlockNavigationParams`    | interface                                                  | `shouldBlock?: (event) => Effect<boolean, RedirectError \| CancelNavigation, R>`.                  |

When a navigation is blocked, the handler receives a `Blocking` value; call `cancel` to abort, `confirm` to proceed, or `redirect(url, options?)` to redirect.

### Model types

| Type                    | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `Destination`           | History entry: `id`, `key`, `url`, `state`, `sameDocument`.                       |
| `ProposedDestination`   | Like `Destination` but without `id`/required `key`; used for “to” in transitions. |
| `NavigationType`        | `"push"` \| `"replace"` \| `"reload"` \| `"traverse"`.                            |
| `Transition`            | `type`, `from` (Destination), `to` (ProposedDestination), `info?`.                |
| `BeforeNavigationEvent` | `type`, `from`, `delta`, `to`, `info`.                                            |
| `NavigationEvent`       | `type`, `destination`, `info`.                                                    |
| `NavigationError`       | Error class; wraps underlying `error`.                                            |
| `RedirectError`         | Error class; `url`, `options?: { state?, info? }`.                                |
| `CancelNavigation`      | Error class; no payload.                                                          |

### Handler types

- **BeforeNavigationHandler&lt;R, R2&gt;** — `(event: BeforeNavigationEvent) => Effect<Option<Effect<unknown, RedirectError | CancelNavigation, R2>>, RedirectError | CancelNavigation, R>`. `R` is required while selecting a response; `R2` is required while running the selected effect. Both stages may redirect or cancel.
- **NavigationHandler&lt;R, R2&gt;** — `(event: NavigationEvent) => Effect<Option<Effect<unknown, never, R2>>, never, R>`. `R` is required while selecting a post-commit effect; `R2` is required while running it. Neither stage has a typed error channel.

Registering either handler on a `Navigation` service requires `R | R2 | Scope.Scope`. Calling the static `Navigation.onBeforeNavigation` or `Navigation.onNavigation` form additionally requires the `Navigation` service itself.

### Core utilities

| Export                      | Type                                                | Description                                                                        |
| --------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `getUrl(origin, urlOrPath)` | `(origin: string, urlOrPath: string \| URL) => URL` | Resolve `urlOrPath` against `origin`; returns a `URL`.                             |
| `NavigationState`           | type                                                | Internal state: `entries`, `index`, `transition`.                                  |
| `makeNavigationCore`        | Effect                                              | Low-level constructor for custom navigation backends; not typically used directly. |
