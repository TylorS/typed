---
id: effect-channels
term: "Effect channels"
definition: "The success, expected-error, and required-service type parameters carried by Effect and Fx."
aliases: [A E R, success error requirements]
related: [effect, service, scope]
links: [https://www.effect.website/docs/v4/getting-started/the-effect-type/]
---

In `Effect<A, E, R>` and `Fx<A, E, R>`, `A` is the value, `E` is an expected failure, and `R` names
required services. An invoice lookup might produce invoice data, fail with a repository error, and
require an invoice repository service.

A wrapper should preserve errors and requirements that remain. Handling every expected error can
make `E` become `never`; supplying every required service can make `R` become `never`. A type
assertion alone does neither. Channels describe contracts; [Scope](#scope)
controls resource lifetime. See [library development](/explore/library-developers).
