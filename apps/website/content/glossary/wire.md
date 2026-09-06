---
id: wire
term: "Wire"
definition: "A stable group of DOM nodes treated as one rendered value."
aliases: []
related: [dom-render-event, keyed-identity, dynamic-range]
links: []
---

A Wire groups concrete nodes as one rendered value without adding a wrapper element. An item can
render a heading and description together without inserting a div that changes the layout.
A DomRenderEvent can carry that group while preserving its members’ node identities.

A stable collection key associates the group with changing item data. Wire describes output shape,
not the producer’s resource lifetime. See [Wire and rendered output](/explore/wire-and-rendered-dom-output).
