---
id: scope
term: "Scope"
definition: "The lifetime boundary for acquisition and finalization."
aliases: []
related: [effect, fx, cooperative-ownership]
links: [https://www.effect.website/docs/v4/resource-management/scope/]
---

A Scope registers finalizers and closes the lifetime that acquired resources. Scoped fibers,
subscriptions, and mounts connect their active work to that boundary rather than relying on an
unrelated DOM removal or a global cleanup list.

A first render emission is a readiness signal, not the lifetime of an interactive view. Keep its
subscription alive while it is mounted. Each `component()` run forks a child Scope; ending that
subscription with `take(1)` closes the child and releases its resources. A directly rendered template
may also have resources attached to an enclosing Scope, so test teardown by interrupting the live
renderer and closing its owning Scope. See [lifetime contracts](/explore/fx-services-and-lifetime)
and [cleanup tests](/explore/testing-typed-systems).
