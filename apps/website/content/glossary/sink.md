---
id: sink
term: "Sink"
definition: "A consumer of pushed Fx values."
aliases: []
related: [fx, effect, scope]
links: []
---

A Typed Sink receives Fx successes and complete failure Causes through Effect callbacks. Its own
service requirements join those of the producer when the Fx runs. A logging consumer may therefore
need a logging service even when its source needs none.

Ordering and interruption follow the producing and consuming run. This is Typed’s Fx Sink, distinct
from Effect Stream’s Sink abstraction. See [writing consumers](/explore/sink-writing-effects) and the
[Sink API](/reference/modules/%40typed%2Ffx%2FSink).
