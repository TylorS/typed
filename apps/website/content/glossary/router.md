---
id: router
term: "Router"
definition: "The CurrentRoute and Navigation requirements used by reactive route selection."
aliases: []
related: [route, matcher, scope]
links: []
---

`Router` names the requirements `CurrentRoute | Navigation`. Browser, server, and test Layers supply
those services with the appropriate navigation implementation. A Matcher uses them to select output
and give the selected route its lifetime.

Replacing the browser provider with TestRouter lets the same selection run against memory history.
This does not change the Route’s URL contract. See [navigation services](/explore/navigation-as-an-effect-service)
and [routing tests](/explore/testing-typed-systems).
