---
id: adapter-ownership
term: "Adapter ownership"
definition: "The agreement separating DOM placement from explicitly acquired foreign-renderer cleanup."
aliases: []
related: [cooperative-ownership, dom-render-event, scope]
links: []
---

An adapter publishes the boundary between two owners. For an editor, Typed may place the host while
the editor owns its descendants and document model. `DomRenderEvent(editorHost)` carries the node;
it cannot discover the editor’s destroy operation.

Acquire the mount with an explicit finalizer in the adapter’s Scope. The
[cooperative ownership guide](/explore/cooperative-by-design) works through placement and disposal;
[integration recipes](/integrate) apply that agreement to existing renderers.
