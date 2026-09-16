---
id: push
term: "Push"
definition: "A paired Sink input and Fx output, with independently typed values and failures."
aliases: []
related: [sink, fx, subject, service]
links: []
---

A Push combines a [Sink](#sink) that accepts inputs with an [Fx](#fx) that publishes outputs.
The sides can have different value and error types: a command input might produce a reply stream.
Pairing them does not automatically connect input handling to output production; the supplied
implementation defines that relationship.

`Push.Service` exposes both sides through one named dependency. It adds no queue, request
correlation, or replay policy. See the
[paired service example](/explore/shared-state-contracts#pair-different-input-and-output-contracts-with-pushservice).
