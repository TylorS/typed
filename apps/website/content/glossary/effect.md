---
id: effect
term: "Effect"
definition: "A typed description of work with success, error, and required-service channels."
aliases: []
related: [fx, scope, subject]
links: [https://www.effect.website/docs/v4/getting-started/the-effect-type/]
---

An Effect describes an execution with a success value, expected errors, and required services.
A save command eventually succeeds or fails when run. Describing it alone saves nothing; running it
twice can save twice. Defects and interruption remain distinct from expected failures.

[Fx](#fx) describes pushed values over time using the same channels. An event binding can run a save
Effect when the user acts; see [template values and events](/explore/render-your-first-template).
