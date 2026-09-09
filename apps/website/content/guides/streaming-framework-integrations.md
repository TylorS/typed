---
title: "Streaming SSR across framework boundaries"
summary: "Keep React and Vue output streaming inside Typed, and identify the boundaries that buffer a component body."
section: "Template rendering"
kind: "reference"
order: 4.2
---

**Typed supports third-party streaming SSR out of the box.** React and Vue forward their HTML
chunks directly into Typed's render stream.

## Streaming support by direction

“Incremental” means the embedded component's HTML crosses the framework boundary in chunks,
before its complete body is ready.

**Typed Host** means the framework renders inside Typed. **Integration Host** means Typed renders
inside that framework.

| Integration | Typed Host | Integration Host | Notes |
| --- | --- | --- | --- |
| [React](/integrate/react) | **Yes** | **No** | [React notes](#react-notes) |
| [Vue](/integrate/vue) | **Yes** | **No** | [Vue notes](#vue-notes) |
| [Svelte](/integrate/svelte) | **No** | **No** | [Svelte notes](#svelte-notes) |
| [Astro](/integrate/astro) | N/A | **No** | [Astro notes](#astro-notes) |

A **No** applies to the embedded component's body; the host may still stream surrounding markup
or a fallback. **N/A** means that integration direction is not supported.

### React notes

React's [`dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
accepts a completed HTML value, not a foreign stream. Our adapter collects each Typed child's HTML
before inserting it into React.

### Vue notes

Vue's [`v-html`](https://vuejs.org/api/built-in-directives.html#v-html) accepts a completed HTML
value, not a foreign stream. Our adapter collects each Typed child's HTML before inserting it
into Vue.

### Svelte notes

With Typed as host, Svelte's server [`render`](https://svelte.dev/docs/svelte/svelte-server#render)
returns a completed `body` string, not a stream of HTML chunks.

With Svelte as host, [`{@html}`](https://svelte.dev/docs/svelte/@html) accepts a completed HTML
value, not a foreign stream. Our adapter collects each Typed child's HTML before insertion.

### Astro notes

The Astro integration supports Typed inside Astro only. Astro's
[framework renderer contract](https://docs.astro.build/en/reference/renderer-reference/#ssrloadedrenderervaluerendertostaticmarkup)
requires an `html` string from `renderToStaticMarkup`, so the adapter collects each Typed island.

## Send the stream to the browser

Consume `renderToHtml` inside the request Scope, or use `streamingSsrForHttp` for the Effect HTTP
adapter. `renderToHtmlString` intentionally collects the result. Your HTTP writer and deployment
must also forward chunks for the browser to receive them incrementally. The
[React](/integrate/react) and [Vue](/integrate/vue) recipes show the response boundary.

For the chunk/completion protocol, see [HTML render events](/explore/html-render-event).
For the server-to-browser handoff, read
[server rendering and hydration](/explore/server-rendering-and-hydration).
