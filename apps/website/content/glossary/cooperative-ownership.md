---
id: cooperative-ownership
term: "Cooperative ownership"
definition: "Updating only the DOM and lifetime a participant owns."
aliases: []
related: [dynamic-range, scope, wire]
links: []
---

Participants can share a document while writing different fields and ranges. Typed might own a
caption and place a chart host, while the chart owns that host’s descendants. Both independently
writing the chart’s children would break the agreement.

Root `render(view, host)` uses the host as a mount slot, so give it a dedicated element. Cleanup also
needs an owner: placement alone does not release a foreign renderer’s resources. See
[cooperative boundaries](/explore/cooperative-by-design).
