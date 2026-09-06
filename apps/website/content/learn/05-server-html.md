---
id: "server-html"
title: "Send the first view from the server"
summary: "Keep the Counter, change the renderer, and run a development server that delivers HTML before the browser module loads."
order: 5
---

Keep `Counter.ts` from [the derived state lesson](/explore/counter/component-lifetime). Now the server will send its first HTML, and the browser will make that existing view interactive.

### Put the Counter in a document

Create `src/server.ts`. Its document template places `Counter` inside a host and loads a matching browser entry:

```ts
// @source examples/learn-5/src/server.ts#L12-L15
// @expect <main id="app">${Counter}</main>
// @expect <script type="module" src="/src/client.ts"></script>
```

Use `HtmlRenderTemplate` to interpret the document as HTML:

```ts
// @source examples/learn-5/src/server.ts#L18-L24
// @expect export const markup =
// @expect renderToHtmlString(Document)
// @expect Effect.provide(HtmlRenderTemplate)
```

`renderToHtmlString` collects the first rendered value. `Effect.scoped` closes the resources used to produce it. The doctype enables standards mode. Keep the rendering comments in the result: they identify DOM ranges during hydration.

### Give the browser its matching entry

Create `src/client.ts`. Target **Counter inside #app**, so the browser adopts the same subtree the server rendered:

```ts
// @source examples/learn-5/src/client.ts#L6-L15
// @expect const host = document.getElementById("app");
// @expect await render(Counter, host).pipe(
// @expect Layer.provide(DomRenderTemplate.using(document))
```

`src/main.ts` can remain on disk. The server document loads only `/src/client.ts`; one entry starts this page's render lifetime.

### Serve the page and its modules

Create `dev.ts` in the project root. Start Vite as middleware so it can serve the browser's TypeScript modules:

```ts
// @source examples/learn-5/dev.ts#L4-L7
// @expect const vite = await createViteServer({
// @expect server: { middlewareMode: true }
```

For `/`, the Node request handler loads the server entry and sends its HTML:

```ts
// @source examples/learn-5/dev.ts#L15-L17
// @expect const { markup } = await vite.ssrLoadModule("/src/server.ts");
// @expect const document = await vite.transformIndexHtml("/", markup);
// @expect response.writeHead(200
```

`/` receives HTML; `/src/client.ts` receives JavaScript transformed by Vite. This uses Vite's [middleware SSR API](https://vite.dev/guide/ssr.html#setting-up-the-dev-server). Copy the complete files before starting the server.

### Complete files

<details class="curriculum-file">
<summary>src/server.ts</summary>

```ts file="src/server.ts"
// @source examples/learn-5/src/server.ts
```

</details>

<details class="curriculum-file">
<summary>src/client.ts</summary>

```ts file="src/client.ts"
// @source examples/learn-5/src/client.ts
```

</details>

<details class="curriculum-file">
<summary>dev.ts</summary>

```ts file="dev.ts"
// @source examples/learn-5/dev.ts
```

</details>

### Run the server

Stop the earlier Vite command, then run:

```sh file="terminal"
npm install --save-dev tsx @types/node
npx tsx dev.ts
```

Open `http://127.0.0.1:5174`. View the page source: **Counter**, **0**, and the buttons should already be in the response. Disable JavaScript and reload to check that the count remains visible. Enable JavaScript and reload again; **Increase** should now change it to **1**.

If `/` returns 500, check the server terminal. If the HTML appears but the buttons do nothing, check the `/src/client.ts` request and browser console.

Both sides still initialize zero. Next we'll restore a value chosen by the server. For a framework that manages the server and asset delivery, see the [Astro integration](/integrate/astro).
