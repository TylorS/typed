---
id: filtered
term: "Filtered"
definition: "A conditional read-only state view whose current value may be absent."
aliases: []
related: [computed, refsubject, fx]
links: []
---

A Filtered view distinguishes a missing current match from a present value. Its current Effect read
fails with `NoSuchElementError` while absent; its Fx observation emits only present matches.

If an absent selection must clear a label, skipping an emission is insufficient. Use an explicit
Option-valued state so both presence and absence reach the view. See
[conditional state](/explore/derived-conditional-and-accumulated-state); [Computed](#computed) is the
related read-only view without this added absence contract.
