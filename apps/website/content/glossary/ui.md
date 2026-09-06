---
id: ui
term: "UI"
definition: "Typed's native-component layer for composing browser semantics around application-owned state."
aliases: [typed ui]
related: [accessibility, refsubject, template]
links: []
---

Typed UI supplies reusable interaction and native-host behavior around application state. It renders
through Template without introducing another state runtime. Styles choose the appearance; the host
and behavior must still carry the appropriate events, focus, and accessibility state.

Return `html` directly when that is sufficient. Use `component` when a view needs generator-based
Effect setup, and `Fx.fn` for noncomponent generator functions. Start at [the UI hub](/explore/ui) and
[component construction](/explore/ui-component).
