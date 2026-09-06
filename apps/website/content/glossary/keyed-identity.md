---
id: keyed-identity
term: "Keyed identity"
definition: "A stable key associating data with an existing rendered node."
aliases: []
related: [dynamic-range, wire, dom-render-event]
links: []
---

A key associates a logical item with retained rendered output. An invoice ID stays the same after
sorting; its array index does not. Use stable, distinct keys within the collection so retained items
keep their row and child Scope.

For server/client identity, use string, number, or `Symbol.for()` keys instead of process-local
`Symbol()`. Native state preservation also depends on the platform move operation; JavaScript node
identity alone is not a focus guarantee. See [keyed collections](/explore/keyed-template-collections).
