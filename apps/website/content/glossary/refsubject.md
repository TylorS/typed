---
id: refsubject
term: "RefSubject"
definition: "A current value plus a pushed stream of changes."
aliases: []
related: [subject, fx, effect]
links: []
---

A RefSubject combines a readable current value, update operations, and pushed changes. It can model
an order quantity without a renderer: yield it in an Effect to read now, update it through RefSubject
operations, or observe its changes.

Passing the RefSubject into a template keeps that value live. Passing an already-read number takes
a snapshot. Derive a total from the quantity instead of creating a second writable fact. Start with
[renderer-independent state](/explore/refsubject-renderer-independent-state).
