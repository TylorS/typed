---
id: layer
term: "Layer"
definition: "A description of how to build dependencies and own their acquisition and release."
aliases: []
related: [service, scope, fiber]
links: []
---

A Layer describes how to construct services or install scoped work. Composing Layers with
`Layer.provide` forms a dependency graph: reused Layer instances can share their builds within that
graph, while the owning [Scope](#scope) coordinates resource release.

For an application, `Fx.drainLayer` installs running work in that graph and `Layer.launch` keeps its
lifetime open. Separate `Fx.provide` boundaries create separate scopes and builds. Providing a
source service does not itself share that source's subscriptions. See
[service and subscription lifetimes](/explore/fx-services-and-lifetime) and the
[Layer-based routing entry](/explore/routing-routes-matchers-and-navigation).
