---
id: fiber
term: "Fiber"
definition: "A running Effect whose result and lifetime can be observed and interrupted."
aliases: [interruption]
related: [effect, scope, fx]
links: []
---

Forking an Effect starts a Fiber. Its owner can await its result or request interruption; scoped
fibers are interrupted when their owning [Scope](#scope) closes. Interruption participates in
finalization, so stopping work includes releasing its resources rather than simply abandoning a
callback. It does not undo external actions that already completed.

Fx makes relationships between these executions declarative. `switchMap` replaces obsolete inner
work, `concatMap` waits for each inner run, and concurrency policies bound overlap. A mapping
operation need not fork a new Fiber for every value. See
[higher-order policies](/explore/fx-higher-order-and-concurrency).
