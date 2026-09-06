---
id: template
term: "Template"
definition: "A renderer-neutral description of static markup and dynamic parts."
aliases: []
related: [renderable, render-event, render-template]
links: []
---

The parsed Template class records static nodes, dynamic parts and paths, and a hydration hash.
It owns metadata rather than live nodes or subscriptions. Renderer implementations use that structure
to locate the concrete targets they will update.

The `html` tag returns an Fx interpreted by a RenderTemplate service, not the parsed class itself.
That distinction separates composing views from inspecting compiler output. See
[the compilation pipeline](/explore/template-compilation-pipeline).
