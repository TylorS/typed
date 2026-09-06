# TodoMVC example

> **Beta:** This example depends on beta packages; APIs may change.

TodoMVC-style app demonstrating **routing**, **layered architecture**, and full use of typed. It uses **@typed/fx**, **@typed/router**, **@typed/template**, and **@typed/ui** with a clear split: domain, application, presentation, and infrastructure. Routing is used for the filter (all/active/completed); TodoMVC CSS is included.

This is a standard [Vite](https://vite.dev) + TypeScript app. From the repo root, install and build workspace packages first, then start the Vite dev server.

## Packages used

- `@typed/fx`
- `@typed/router`
- `@typed/template`
- `@typed/ui`
- `effect`

## How to run

From a fresh clone, install and build the monorepo from the **repo root** first:

```bash
pnpm install
pnpm build
```

Then, from the repo root:

```bash
cd examples/todomvc && pnpm dev
```

This starts the Vite dev server at [http://localhost:5173](http://localhost:5173).

**Other commands** (run from `examples/todomvc`):

- `pnpm build` — production build
- `pnpm preview` — serve the production build locally

## Structure

- `src/main.ts` — Renders `TodoApp` into `document.body` with `Services` and `DomRenderTemplate`.
- `src/domain.ts` — Todo and TodoList types.
- `src/application.ts` — App services (TodoList, FilterState, TodoText, CreateTodo) and business logic.
- `src/presentation.ts` — UI built with `html` and RefSubject; uses router filter state and Link.
- `src/infrastructure.ts` — Layers: Todos (KeyValueStore), Router (match + BrowserRouter), CreateTodo.

See the [root README](../../README.md) and the [packages](../../packages) for more.
