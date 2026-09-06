---
id: dynamic-range
term: "Dynamic range"
definition: "The bounded DOM region controlled by one structural part."
aliases: []
related: [keyed-identity, dom-render-event, cooperative-ownership]
links: []
---

A structural part controls its represented nodes in a bounded DOM region. A changing details panel
can insert, remove, or move output without traversing or replacing the heading and footer beside it.
That region is the unit of [local reconciliation](#local-reconciliation).

Do not let another renderer insert unmanaged siblings among those represented nodes. Give a foreign
widget its own host inside the range. See [local DOM updates](/explore/dom-updates-and-reconciliation).
