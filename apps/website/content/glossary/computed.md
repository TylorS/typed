---
id: computed
term: "Computed"
definition: "A read-only contract for a current value and observation of its changes."
aliases: []
related: [refsubject, versioned, filtered, fx]
links: []
---

A Computed keeps current-read and change-observation behavior without exposing writable transitions.
Derive an invoice total from its line items instead of keeping a second writable total. Read it in an
Effect or pass the live view into a template; update the line items to change the result.

A RefSubject already implements Computed and can be exposed directly as `RefSubject.Computed<A>`
to restrict a consumer to reads. No identity `map` is needed; use a projection only when it computes
a different value. This narrows the TypeScript contract without freezing the underlying state.

It retains the source’s error and service requirements. A [Filtered](#filtered) adds conditional
absence. See [derived state](/explore/derived-conditional-and-accumulated-state) and the
[RefSubject API](/reference/modules/%40typed%2Ffx%2FRefSubject).
