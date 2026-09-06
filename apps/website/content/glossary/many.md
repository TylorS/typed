---
id: many
term: "many"
definition: "A keyed Template collection that retains an item's rendered range and child scope while its key remains."
aliases: []
related: [keyed-identity, local-reconciliation, template]
links: []
---

`many(values, key, renderItem)` renders a changing keyed collection. Retained keys keep their rendered
range and child Scope; removed keys close their item work. The renderer receives a RefSubject for
the item, allowing updated data to reach the same retained row.

Derive an invoice amount from that item source. Reading it only once during setup captures a snapshot
even when the key is correct. See [keyed collection examples](/explore/keyed-template-collections).
