---
id: html-render-event
term: "HtmlRenderEvent"
definition: "A branded chunk of trusted, renderer-owned HTML output."
aliases: []
related: [render-event, ssr, fx]
links: []
---

`HtmlRenderEvent(html, last)` carries one trusted, renderer-owned HTML chunk and indicates whether
it is terminal. The producer owns chunk ordering and lifetime; the event is output, not a resource
manager.

A server adapter can publish an already serialized fragment. Wrapping a user comment in this
constructor would bypass ordinary escaping without sanitizing it. Keep application data on the
normal template-value path. See [HTML render events](/explore/html-render-event).
