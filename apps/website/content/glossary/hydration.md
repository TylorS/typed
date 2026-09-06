---
id: hydration
term: "Hydration"
definition: "Attaching behavior to server-rendered DOM while preserving its identity."
aliases: []
related: [ssr, dynamic-range, keyed-identity]
links: []
---

Hydration reconnects client behavior to server-rendered nodes using compatible template markers and
state metadata. It should adopt the original output rather than construct a similar-looking tree.
An input may already contain browser or user state before the client starts.

Test adoption by retaining the original element reference, then checking restored state and a later
update. Matching markup alone proves less. Follow [Quick Start](/explore/quick-start) and
[hydration tests](/explore/testing-typed-systems).
