---
id: ssr
term: "SSR"
definition: "Rendering semantic HTML on the server."
aliases: [server-side rendering]
related: [hydration, html-render-event, render-template]
links: []
---

Server-side rendering produces useful HTML before the browser runs client code. A form can already
show its labels and values; a streaming renderer can publish ordered HtmlRenderEvent chunks and
mark completion. Application data still uses ordinary escaped interpolation.

Hydration adds client behavior afterward. Static HTML rendering intentionally omits interactive
hydration metadata, so choose it for output that will stay static. See [Quick Start](/explore/quick-start)
and [server/client verification](/explore/testing-typed-systems).
