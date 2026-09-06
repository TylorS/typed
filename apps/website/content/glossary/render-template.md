---
id: render-template
term: "RenderTemplate"
definition: "The service that interprets templates for a target renderer."
aliases: []
related: [render-event, effect, scope]
links: []
---

RenderTemplate is the service that interprets a template for a target. The same `html` expression
can use DomRenderTemplate in a browser or HtmlRenderTemplate for server output. Providing the service
selects its interpretation; the resulting program still needs to run.

An adapter that already has nodes usually needs a RenderEvent rather than another interpreter.
Read [the compilation pipeline](/explore/template-compilation-pipeline) before
[implementing a renderer](/explore/implementing-render-template).
