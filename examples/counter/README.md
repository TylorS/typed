# Counter example

> **Beta:** This example depends on beta packages; APIs may change.

Minimal counter app demonstrating **reactive state** and **DOM rendering** with typed. It uses **@typed/fx** (Fx, RefSubject) for state and **@typed/template** (`html`, `render`, `DomRenderTemplate`) to render into the document. A good first example for seeing how RefSubject and the template tag work together.

This is a standard [Vite](https://vite.dev) + TypeScript app. From the repo root, install and build workspace packages first, then start the Vite dev server.

## Packages used

- `@typed/fx`
- `@typed/template`
- `effect`

## How to run

From a fresh clone, install and build the monorepo from the **repo root** first:

```bash
pnpm install
pnpm build
```

Then, from the repo root:

```bash
cd examples/counter && pnpm dev
```

This starts the Vite dev server at [http://localhost:5173](http://localhost:5173).

**Other commands** (run from `examples/counter`):

- `pnpm build` — production build
- `pnpm preview` — serve the production build locally

## Structure

- `src/main.ts` — Entry point: builds the Counter Fx (RefSubject + template), then runs `render(Counter, document.body)` with `DomRenderTemplate` provided.

See the [root README](../../README.md) and [@typed/template](../../packages/template/README.md) for more.
