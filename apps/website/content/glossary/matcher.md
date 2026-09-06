---
id: matcher
term: "Matcher"
definition: "An immutable route table that selects reactive output for the current navigation location."
aliases: []
related: [route, router, fx]
links: []
---

A Matcher is an immutable table of ordered route cases that produces reactive output when run.
Registration builds the description; matching, guards, navigation observation, and selected-route
lifetime happen with the required Router services.

Literal paths take precedence over parameter paths. Registration order decides among candidates
with the same compiled path, whose decoding and guards are tried in sequence. Inspect that distinction
when a URL selects an unexpected case. See
[live route selection](/explore/router-navigation-live-selection) and the
[Matcher API](/reference/modules/%40typed%2Frouter%2FMatcher).
