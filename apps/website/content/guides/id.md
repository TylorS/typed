---
title: "@typed/id: generate and validate identifiers"
summary: "Create branded IDs through Effect, validate them at boundaries, and make generation deterministic in tests."
section: "State"
kind: "guide"
order: 2.5
---

<span id="match-the-format-to-the-identity-contract"></span>

`@typed/id` provides schemas for identifier formats and Effect-based generators. Generate an ID in
the command that creates an entity, store it with that entity, and reuse it for rendering and later
updates. Do not generate identity from a template projection.

```sh
pnpm add @typed/id effect
```

## Create an entity with the shared `Ids` facade

<span id="choose-one-generator-or-the-application-facade"></span>

`Ids` is the application facade. Its requirements bubble through a command until the runtime
provides them, so creation stays explicit and testable.

```ts
import { Effect } from "effect"
import { Ids } from "@typed/id/Ids"

type Issue = { readonly id: string; readonly title: string }

const createIssue = Effect.fn(function* (title: string) {
  const id = yield* Ids.uuid7
  return { id, title } satisfies Issue
})

const program = createIssue("Document @typed/id").pipe(Effect.provide(Ids.Default))
const issue = await Effect.runPromise(program)
```

Provide `Ids.Default` once around the application or feature that shares IDs. Its UUIDv7 facade
shares one lazy `Uuid7State` for that Layer, preserving local sequence state. This is local
monotonicity, not a distributed ordering or authorization guarantee.

## Choose a focused generator when the facade is unnecessary

Use a focused module when one boundary needs one format and no application-wide generator service.

```ts
import { Effect } from "effect"
import { uuid7, Uuid7State } from "@typed/id/Uuid7"

const id = await Effect.runPromise(uuid7.pipe(Effect.provide(Uuid7State.Default)))
```

`uuid7` requires `Uuid7State`; the facade is preferable when several commands must share its state.
The [API reference](/reference/modules/%40typed%2Fid) lists UUIDv4, UUIDv5, UUIDv7, ULID, KSUID,
NanoId, CUID, their schemas, and their focused dependencies.

## <span id="reference-match-the-format-to-the-identity-contract">Choose a format by its dependency</span>

| Need | Focused module | Dependency or contract |
| --- | --- | --- |
| Random UUID | `Uuid4` | `RandomValues` |
| Deterministic name | `Uuid5` | explicit namespace and name |
| Time-bearing UUID | `Uuid7` | shared `Uuid7State` |
| Time-bearing string | `Ulid` or `Ksuid` | time and entropy |
| Compact random string | `NanoId` | entropy |

Use `Ids` when the feature shares these dependencies; use a focused generator at a narrow boundary.

## <span id="carry-identity-through-optimistic-creation-and-acknowledgment">Carry identity through acknowledgement</span>

Keep a client-generated entity key when a server later returns a persistent ID. Replacing the
rendering key makes acknowledgement look like deleting and remounting a row, which can discard
focus or local draft state. Store the server ID beside the client key instead.

## Decode external IDs through a schema

<span id="decode-external-ids-through-their-schema"></span>

Brands prevent accidental format mixing in TypeScript. A schema also validates an ID arriving from
JSON, a URL, or storage.

```ts
import { Schema } from "effect"
import { Uuid7 } from "@typed/id/Uuid7"

const Invoice = Schema.Struct({ id: Uuid7, description: Schema.String })
const decodeInvoice = Schema.decodeUnknownEffect(Invoice)

const invoice = decodeInvoice({
  id: "018f3c8a-4c00-7000-8000-000000000001",
  description: "Documentation work",
})
```

A UUID format is not a domain type or permission check. Add a domain distinction when two entities
must not mix, then perform normal authorization after decoding.

## Make generation deterministic in tests

<span id="make-tests-repeatable-without-changing-production-imports"></span>

`IdsTest` is deliberately separate from production imports. Each test Layer supplies fixed time,
seeded entropy, and fresh UUIDv7 sequence state.

```ts
import { Effect } from "effect"
import { expect } from "@effect/vitest"
import { Ids } from "@typed/id/Ids"
import { IdsTest } from "@typed/id/IdsTest"

const pair = Effect.fn(function* () {
  return [yield* Ids.uuid7, yield* Ids.uuid7] as const
})

const first = await Effect.runPromise(pair().pipe(Effect.provide(IdsTest({ currentTime: 0 }))))
const repeated = await Effect.runPromise(pair().pipe(Effect.provide(IdsTest({ currentTime: 0 }))))

expect(first[0]).not.toBe(first[1])
expect(first[0]).toBe(repeated[0])
```

The first assertion proves sequence state advances within one Layer; the second proves an identical
fresh Layer reproduces the sequence. Keep client IDs stable through
[optimistic edits](/explore/async-data-optimistic-edits) and hydration rather than replacing a row
key when a server acknowledgement arrives. `currentTime` fixes `DateTimes`; advancing the TestClock
provided by `IdsTest` does not advance that fixed time service. Provide a custom `DateTimes` Layer
when a test needs generator time to change.

## Diagnose identity changes

Trace the creation command, not the renderer. Count generator executions and check for remounts or
recreated entities. Deterministic layers make equal generator-call sequences comparable; they do not
make two different programs consume the same IDs.
