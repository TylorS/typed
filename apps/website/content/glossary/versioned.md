---
id: versioned
term: "Versioned"
definition: "A current-value Effect, update Fx, and numeric invalidation token exposed as one capability."
aliases: []
related: [computed, refsubject, fx, service]
links: []
---

Versioned adapts a value whose producer owns its state. Consumers can read its current value,
observe updates, and read its version token without receiving a write operation. The update and
current-value channels may have different types and failures.

The producer keeps those channels consistent. Versioned does not automatically increment the
token, make reads atomic, or synchronize an external store. `Versioned.Service` supplies this
capability through a Layer. See [Versioned state](/explore/versioned-state) for an adapter and its
snapshot/subscription contract.
