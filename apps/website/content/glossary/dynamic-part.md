---
id: dynamic-part
term: "Dynamic part"
definition: "One interpolation target in a Template that retains the exact DOM field or node range it updates."
aliases: [template part]
related: [dynamic-range, local-reconciliation, template]
links: []
---

A dynamic part captures the exact target of an interpolation. Text, attributes, properties, listeners,
and structural output have different update behavior. Changing a text part writes text; changing
`.value=${draft}` writes the input’s current property. An attribute binding is not interchangeable
with that property binding.

Structural output uses a bounded [dynamic range](#dynamic-range). See
[element bindings](/explore/template-element-bindings) to choose the target that matches the browser
behavior you need.
