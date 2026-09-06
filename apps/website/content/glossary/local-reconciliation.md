---
id: local-reconciliation
term: "Local reconciliation"
definition: "Updating only the concrete nodes inside one dynamic range when structural output changes."
aliases: []
related: [dynamic-part, dynamic-range, many]
links: []
---

Structural updates compare and move concrete nodes within one dynamic range. Adding or reordering
rows needs that local diff; changing a price text part can write its target directly. A keyed
[many](#many) collection adds stable item identity to the structural operation.

Locality limits the region that changes. It does not make arbitrarily large list updates free, nor
imply a document-wide virtual-tree pass. See [the reconciliation cost model](/explore/dom-updates-and-reconciliation).
