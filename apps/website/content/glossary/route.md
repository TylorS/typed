---
id: route
term: "Route"
definition: "An immutable URL contract that parses a path and query into typed, validated parameters."
aliases: []
related: [matcher, router, service]
links: []
---

A Route describes URL syntax and decoding without owning rendering or browser history. A page
number arrives as URL input even if the application wants a number; the Route contract can validate
it before a view assumes it is usable. Decoding requirements remain explicit services.

A Matcher uses routes to select output, while Navigation handles history. See
[typed URL inputs](/explore/route-typed-url-inputs) and the
[Route API](/reference/modules/%40typed%2Frouter%2FRoute).
