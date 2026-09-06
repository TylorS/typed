---
id: dom-render-event
term: "DomRenderEvent"
definition: "A RenderEvent containing already-rendered DOM values."
aliases: []
related: [render-event, wire, dynamic-range, cooperative-ownership]
links: []
---

`DomRenderEvent` carries existing DOM values: a Node, DocumentFragment, Wire, or nested readonly
collection. Publishing an editor host preserves its exact node identity without serializing or
cloning it. The receiving range controls placement; the event does not acquire or dispose the editor.

Keep subscriptions and foreign cleanup in the producer’s lifetime. Compare
[DOM output](/explore/dom-render-event) with [serialized HTML output](/explore/html-render-event).
