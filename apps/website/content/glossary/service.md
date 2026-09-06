---
id: service
term: "Service"
definition: "A dependency named in an Effect or Fx requirement channel and supplied at a composition boundary."
aliases: [requirement, environment]
related: [effect, effect-channels, scope]
links: [https://www.effect.website/docs/v4/requirements-management/services/]
---

A service is a named dependency visible in an Effect or Fx requirement channel. An account repository
can use HTTP in the application and controlled results in a test; the consuming program asks for
the same service in either case.

Providing it satisfies that requirement without erasing expected failures. Resources used to build
it still need an owning Scope. See [Fx services](/explore/fx-services-and-lifetime) and
[testing with providers](/explore/testing-typed-systems).
