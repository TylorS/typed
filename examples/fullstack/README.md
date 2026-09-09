# Full-stack SSR and hydration

This example uses one `@typed/router` matcher in both environments:

- `src/client.ts` renders it with `BrowserRouter` and `DomRenderTemplate`.
- `src/server.ts` adapts it to Effect HTTP with `ssrForHttp`.
- `src/host.ts` connects Vite middleware in development and static assets in production.

The counter begins at `42` on the server and `0` in the browser. `RefSubject.hydrate`
reads the server value from the DOM before the browser initializer can emit, so the page
continues from `42` without flashing `0`.

```sh
pnpm dev
pnpm build
pnpm start
pnpm test:production
```

`dev` and `start` accept `--port <number>`; the default is `3000`.

The production check builds both bundles, starts the HTTP server, and verifies static
assets, hydration from `42` without replacing the server node, and counter interactions
in Chromium. Install the test browser with `pnpm exec playwright install chromium`.
