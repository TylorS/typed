---
id: computed
term: "Computed"
definition: "A read-only, changing view derived from a RefSubject or another versioned source."
aliases: []
related: [refsubject, filtered, fx]
links: []
---

A Computed keeps current-read and change-observation behavior without exposing writable transitions.
Derive an invoice total from its line items instead of keeping a second writable total. Read it in an
Effect or pass the live view into a template; update the line items to change the result.

It retains the source’s error and service requirements. A [Filtered](#filtered) adds conditional
absence. See [derived state](/explore/derived-conditional-and-accumulated-state) and the
[RefSubject API](/reference/modules/%40typed%2Ffx%2FRefSubject).
