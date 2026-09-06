# @typed/router

> **Beta:** This package is in beta; APIs may change.

## Purpose

`@typed/router` provides **typed routing** for Effect apps: path and query parameters derived from route strings and decoded via Effect Schema, **Route** definitions, **Matcher** (pattern matching on routes), **CurrentRoute**, and **Router** layers. Use it when you need type-safe routing with parsable path/query and composable matchers that produce Fx streams and react to path changes.

## Use cases

- **Typed SPAs** — `BrowserRouter()` + `run(matcher)` for client-side routing; matcher cases yield Fx that switch as the path changes.
- **SSR** — `ServerRouter({ initialMemory })` for server rendering with in-memory navigation.
- **Tests** — `TestRouter()` from `@typed/router/RouterTest` with deterministic IDs for predictable route tests.

## Architecture

1. **Route** — Define paths (`Route.Parse("/todos/:id")`), optionally with query (`?filter=`). Path and query types come from the route string.
2. **Matcher** — Add cases via `match(route, handler)`; each case returns an Fx, Effect, Stream, or value. Nest routes with `prefix(route)`.
3. **run(matcher)** — Compile the matcher and return an Fx that reacts to `CurrentPath` from `Navigation`. When the path changes, the matcher selects the matching case, scopes the previous handler, and yields the new handler's Fx.
4. **Router layers** — Provide `BrowserRouter`, `ServerRouter`, or `TestRouter` to supply `Navigation` and a stable `CurrentRoute` mount context.

## Dependencies

- `effect`
- `@typed/fx`
- `@typed/guard`
- `@typed/id`
- `@typed/navigation`

## API overview

- **Route** — `make(ast)`, `path`, `paramsSchema`, `pathSchema`, `querySchema`; path/query types are derived from the route path string.
- **Matcher** — cases keyed by route; each case returns an Fx; `prefix(parentRoute)` for nested routes; compile to router entries.
- **CurrentRoute** — ambient route context. Router layers provide a stable mount tree; nested layers and request adapters can shadow it with a more specific tree.
- **Router** — `compile(matcher)`, `makeLayerManager`, `makeCatchManager`, `makeLayoutManager` for building the routing layer.
- **Join**, **Parse** — helpers for path/query construction and parsing.

## Example

Define routes with `Router.Parse` and `Router.match`, then provide `Router.BrowserRouter()` (see the [TodoMVC example](https://github.com/TylorS/typed/tree/development/examples/todomvc)):

```ts
import * as Router from "@typed/router";

const filterState = Router.match(Router.Slash, "all")
  .match(Router.Parse("active"), "active")
  .match(Router.Parse("completed"), "completed")
  .pipe(Router.redirectTo("/"));

// Provide Router.BrowserRouter() and use filterState (or other matchers) in your layers
```

## API reference

### Router

| Symbol                   | Description                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `Router`                 | Type: `CurrentRoute` or `Navigation`. The routing service union.                                                |
| `BrowserRouter(window?)` | `Layer<Router, NavigationError>`. Provides router using the browser `window` (or global).                       |
| `ServerRouter(options)`  | `Layer<Router, NavigationError>`. Uses navigation memory or initial memory.                                     |
| `TestRouter(options)`    | `Layer<Router, Cause.IllegalArgumentError \| NavigationError>`. Adds deterministic IDs and their checked input. |

### Route

| Symbol                                              | Description                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Route<P, S>`                                       | Interface: `ast`, `path`, `paramsSchema`, `pathSchema`, `querySchema`. Path/query types come from the path string. |
| `Route.make(ast)`                                   | Build a `Route` from an `AST.RouteAst`.                                                                            |
| `Route.Parse(path)`                                 | Parse a path string (e.g. `"/todos/:id?filter=all"`) into a typed `Route`.                                         |
| `Route.Slash`                                       | Route for `"/"`.                                                                                                   |
| `Route.Wildcard`                                    | Route for `"*"`.                                                                                                   |
| `Route.Param(name)`                                 | Route for `/:name` (string param).                                                                                 |
| `Route.ParamWithSchema(name, schema)`               | Route for `/:name` with an Effect Schema codec.                                                                    |
| `Route.Number(name)`                                | Route for `/:name` decoded as number.                                                                              |
| `Route.Int(name)`                                   | Route for `/:name` decoded as integer.                                                                             |
| `Route.Join(...routes)`                             | Join route segments into one route (path and params combined).                                                     |
| `Route.Path<T>`, `Route.Type<T>`, `Route.Params<T>` | Type helpers for a route’s path string, decoded type, and params.                                                  |

Path parameters use `:name`, `:name?`, `:name(regex)`, or `:name(regex)?`. Optional
parameters may appear before later path segments; matcher compilation registers their present and
absent forms without changing the route definition. When a terminal path parameter is followed by
a query declaration, `?name=` starts the query and leaves the path parameter required. Use
`??name=` after an optional terminal parameter: `"/todos/:id??filter=:filter"`.

Every declared query value is scalar. A URL that repeats a declared key, such as
`?filter=open&filter=closed`, fails with `RouteDecodeError` instead of silently choosing one value.
Undeclared query keys are ignored by route decoding.

### Matcher

| Symbol                                 | Description                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Matcher<A, E, R>`                     | Interface: pattern match on routes; each case yields an Fx.                                                  |
| `match`                                | Start a matcher (same as `empty.match`).                                                                     |
| `empty`                                | Empty matcher (no cases).                                                                                    |
| `matcher.match(route, handler)`        | Add a case: `route` + handler (function, Fx, Effect, Stream, or value).                                      |
| `matcher.match(route, options)`        | Add a case with `handler`, optional `dependencies`, `layout`, `catch`.                                       |
| `matcher.match(route, guard, handler)` | Add a case with a guard (e.g. from `@typed/guard`) before the handler.                                       |
| `matcher.prefix(route)`                | Nest this matcher under a parent route.                                                                      |
| `matcher.provide(...layers)`           | Provide Effect layers to the matcher.                                                                        |
| `matcher.provideService(tag, service)` | Provide a single service.                                                                                    |
| `matcher.provideContext(services)`     | Provide a service map.                                                                                       |
| `matcher.catchCause(f)`                | Handle failures by cause.                                                                                    |
| `matcher.catch(f)`                     | Handle failures by error value.                                                                              |
| `matcher.catchTag(tag, f)`             | Handle a specific error tag.                                                                                 |
| `matcher.layout(layout)`               | Wrap matcher output in a layout Fx.                                                                          |
| `run(matcher)`                         | Compile the matcher and return an `Fx` that reacts to the current path (requires `Router` + `CurrentRoute`). |
| `catchCause(input, f)`                 | Attach cause-based error handling to an Fx or matcher run.                                                   |
| `catch(input, f)`                      | Attach error-based handling.                                                                                 |
| `catchTag(input, tag, f)`              | Attach tag-based error handling.                                                                             |
| `redirectTo(path)`                     | Returns a function that, given an Fx or matcher, redirects to `path` on failure.                             |

**Matcher types**

| Type                                 | Description                                                           |
| ------------------------------------ | --------------------------------------------------------------------- |
| `Layout<Params, A, E, R, B, E2, R2>` | `(params) => Fx<B, E2, R2>`; wraps content with params and inner Fx.  |
| `CatchHandler<E, A, E2, R2>`         | `(cause: RefSubject<Cause<E>>) => Fx<A, E2, R2>`.                     |
| `MatchHandler<Params, A, E, R>`      | Handler for a route: Fx, Effect, Stream, value, or `(params) => ...`. |

**Errors**

| Class              | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `RouteNotFound`    | No route matched the path.                            |
| `RouteDecodeError` | Path/query failed to decode (e.g. schema validation). |
| `RouteGuardError`  | Guard rejected (e.g. auth).                           |

### CurrentRoute

| Symbol                       | Description                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `CurrentRoute`               | Ambient, non-reactive route context for the current routing boundary.                    |
| `CurrentRouteTree`           | `{ route: Route<string, any>; parent?: CurrentRouteTree }`.                              |
| `CurrentRoute.Default`       | Provides a stable mount tree from `Navigation.base`; navigation does not mutate it.      |
| `CurrentRoute.extend(route)` | Shadows the ambient context with a fixed nested route whose parent is the prior context. |

`Matcher.run` uses the ambient tree as its route prefix. Read `Navigation.currentEntry` or
`CurrentPath` for the live location. The `@typed/ui` `ssrForHttp` adapter shadows
`CurrentRoute` inside each request handler with that request's matched route tree, preserving
the ambient mount as its parent when one exists.
