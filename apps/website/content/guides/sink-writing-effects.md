---
title: "Sink: write Fx values somewhere useful"
summary: "Give an Fx a typed consumer without coupling the producer to logging, storage, transport, or UI."
section: "Fx"
kind: "guide"
order: 1.16
---

An audit-event producer should not choose whether its destination logs, sends, or records events
for a test. Pass that destination as a `Sink`: a typed consumer for successful values and failures.

After [Consuming Fx](/explore/consuming-fx), `observe` is enough for a local callback. A Sink is
useful when independently assembled code needs to receive the consumer itself. It exposes delivery
without adding subscriptions or current state to the producer's contract.

## Describe what the destination accepts

`Sink<A, E, R>` accepts successful `A` values and complete `Cause<E>` failures, using services `R`
while handling them. The error parameter describes incoming failure, not a new typed failure thrown
by the success callback. Sink callbacks return Effects with no typed failure result.

[`Sink.make(onFailure, onSuccess)`](/reference/symbols/QHR5cGVkL2Z4L1NpbmsjbWFrZQ) constructs the
consumer without performing delivery:

```ts
import { Effect } from "effect"
import { Fx, Sink } from "@typed/fx"

type AuditEvent = { readonly action: string; readonly invoiceId: string }

const auditLog = Sink.make<AuditEvent>(
  (cause) => Effect.logError(cause),
  (event) => Effect.log(`audit ${event.action}: ${event.invoiceId}`),
)

const writeAudit = Fx.fromIterable<AuditEvent>([
  { action: "saved", invoiceId: "invoice-42" },
]).run(auditLog)
```

Executing `writeAudit` starts the finite source, sends its event to `auditLog.onSuccess`, waits for
delivery, and completes. The source carries the invoice ID; the destination chooses its presentation.
No array of audit history is retained by the Sink.

```fx-marble
title: a Sink handles each success and the reported Cause
input source: saved . !offline
operator: source.run(auditLog)
inner delivery: log(saved) . logCause(offline)
output handled: . . . |
```

The delivery lane contains Effects performed by the destination. If the producer reports `offline`,
this particular Sink logs that Cause and completes handling. Logging is an explicit reporting policy:
it does not mean the operation that originally failed succeeded. A custom Sink can therefore produce
a different Effect outcome than a standard Fx runner that fails upon receiving the Cause.

## Keep fallible business work before the reporting boundary

If persisting an audit event can fail with a domain error, represent persistence as an Effectful
producer transformation or observer, where that error remains visible. Do not force it into a Sink
success callback by pretending it cannot fail. The Sink boundary is useful for a destination that
has already chosen how both successes and failures are handled.

Likewise, a Sink is not a queue. A concurrent source may invoke its callbacks concurrently. Awaited
sequential delivery gives order only when the producer honors that contract. Use
[concatMap](/explore/fx-higher-order-and-concurrency) for sequential work or
[Subject publication](/explore/subject-event-publications) for a serialized event boundary.

## Give workflows a named output capability

A service gives the same output capability a name:

```ts
import { Effect } from "effect"
import { Fx, Sink } from "@typed/fx"

type AuditEvent = { readonly action: string; readonly invoiceId: string }

class Audit extends Sink.Service<Audit, AuditEvent>()("app/Audit") {}

const AuditLive = Audit.make(
  (cause) => Effect.logError(cause),
  (event) => Effect.log(`audit ${event.action}: ${event.invoiceId}`),
)

const publishAudit = Fx.fromIterable<AuditEvent>([
  { action: "saved", invoiceId: "invoice-42" },
]).run(Audit).pipe(Effect.provide(AuditLive))
```

`Audit` is itself the typed Sink and introduces the `Audit` requirement. `Audit.make` builds the
Layer supplying its implementation. The application provides that Layer once at its boundary; a
test can provide a recorder with the same event contract. A caller cannot accidentally subscribe to
past events or read current state because the output capability exposes neither operation.

### Replace the destination without changing the workflow

`Sink.Service<Self, A, E>()(id)` uses `A` for accepted values and `E` for accepted failure
Causes. The implementation callbacks still cannot fail with a typed error. `make(onFailure,
onSuccess)` captures their service dependencies when the Layer is built; delivery happens later.

```ts
import { Effect, Ref } from "effect"
import { Fx, Sink } from "@typed/fx"

class Audit extends Sink.Service<Audit, string>()("docs/RecordedAudit") {}

const publish = Fx.fromIterable(["saved", "published"]).run(Audit)
const program = Effect.gen(function* () {
  const records = yield* Ref.make<ReadonlyArray<string>>([])
  const AuditTest = Audit.make(
    (cause) => Effect.die(cause),
    (event) => Ref.update(records, (all) => [...all, event]),
  )

  yield* publish.pipe(Effect.provide(AuditTest))

  return yield* Ref.get(records)
})

const result = await Effect.runPromise(program)
// ["saved", "published"]
```

This test destination treats an unexpected Cause as a defect instead of silently ignoring it.
For direct delivery, use `Audit.onSuccess(value)` or `Audit.onFailure(cause)`; both require
Audit until provided. `Audit.service` is the Context key for retrieving or supplying an existing
Sink. Neither the class declaration nor Layer construction sends an event.

## Test what was delivered, not merely that the source drained

A test destination should record successful payloads and failure Causes separately. Assert the invoice
ID, action, and delivery count; a test that only awaits completion also passes for a destination that
ignores everything. If failure is deliberately logged and consumed, test that outcome explicitly.
A callback defect remains a possible failed run even though its typed failure channel is `never`.
See [testing techniques](/explore/testing-typed-systems) for recording and asserting delivery.

Require only the capability the workflow needs. A publisher needs Sink; subscribers need Subject;
readers and writers of current state need RefSubject. Continue with
[Subject](/explore/subject-event-publications) when notifications must fan out, or
[shared contracts](/explore/shared-state-contracts) when choosing the service boundary for a feature.
