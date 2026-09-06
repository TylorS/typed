---
id: fx
term: "Fx"
definition: "A push-based stream of values with typed errors and requirements."
aliases: []
related: [effect, render-event, sink]
links: [https://www.effect.website/docs/v4/getting-started/the-effect-type/, https://www.effect.website/docs/v4/stream/introduction/]
---

`Fx<A, E, R>` describes producer-driven values over time while retaining typed errors and required
services. A search input, socket, or renderer can publish values into that boundary. Constructing an
Fx starts no work; a running Effect observes it through a [Sink](#sink).

An open input source does not complete just because one value arrived. `collectAll` therefore waits;
use a bounded consumer or a continuing observation. Start with [how Fx runs](/explore/fx-push-reactivity)
and the [operator atlas](/explore/fx-operator-atlas).
