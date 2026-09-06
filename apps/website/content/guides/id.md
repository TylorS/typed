---
title: "IDs with explicit time and entropy"
summary: "Generate branded identifiers, retain identity across renders, and replace generation deterministically in tests."
section: "State"
kind: "guide"
order: 2.5
---

An ID belongs to the entity being created. Generate it in the command that creates a record, store
it with the record, and reuse it for later updates and rendering. Generating an ID in a template
projection gives an existing record a new identity whenever that projection runs.

`@typed/id` supplies branded schemas and Effect-based generators. The generator's type keeps its
time, entropy, and sequence dependencies visible, so tests can replace them without patching globals.

## Choose one generator or the application facade

For one format, import its focused module. UUIDv4 needs an entropy service; the default uses the
runtime's Web Crypto implementation.

```ts
import { Effect } from "effect"
import { RandomValues } from "@typed/id/RandomValues"
import { uuid4 } from "@typed/id/Uuid4"

const createDraft = Effect.map(uuid4, (id) => ({ id, title: "Untitled" })).pipe(
  Effect.provide(RandomValues.Default),
)

await Effect.runPromise(createDraft)
```

Use `Ids` when several parts of the application need a common generator service. Its default Layer
provides system time and entropy and initializes sequence state when a generator needs it.

```ts
import { Effect } from "effect"
import { Ids } from "@typed/id/Ids"

const createInvoice = (description: string) =>
  Ids.uuid7.pipe(Effect.map((id) => ({ id, description, paid: false })))

const program = createInvoice("Documentation work").pipe(Effect.provide(Ids.Default))
await Effect.runPromise(program)
```

Provide the Layer around the application or feature that shares the generator sequence. Rebuilding
it for every call discards that shared sequence state. UUIDv7 can also be used directly with
`uuid7.pipe(Effect.provide(Uuid7State.Default))` from `@typed/id/Uuid7`.

## Carry identity through optimistic creation and acknowledgment

A newly created row often exists locally before the server responds. Give it a stable client key
when the create command starts. If the server assigns a different persistent ID, store that ID as a
separate field on the same entity instead of replacing the rendering key. Otherwise an acknowledgment
looks like deleting one row and mounting another, which can reset focused inputs and local state.

```ts
import { Effect, Option } from "effect"
import { Ids } from "@typed/id/Ids"

const draft = Effect.map(Ids.uuid7, (clientKey) => ({
  clientKey,
  serverId: Option.none<string>(),
  title: "Untitled issue",
}))

const acknowledge = <A extends { readonly clientKey: unknown; readonly title: string }>(
  local: A,
  serverId: string,
) => ({ ...local, serverId: Option.some(serverId) })
```

The client key says “this local entity.” The server ID says “this stored record.” A retry identifier
may be a third contract: whether reusing it deduplicates a request is decided by the server API,
not by the random ID generator. Use the same entity key through
[optimistic edits](/explore/async-data-optimistic-edits) and hydration.

## Match the format to the identity contract

| Format | Useful property |
| --- | --- |
| UUIDv4 | Random UUID without a timestamp ordering contract. |
| UUIDv5 | Deterministic name within an explicit namespace. |
| UUIDv7 | Timestamp-based UUID with sequence state shared by its owner. |
| ULID / KSUID | Time-bearing string IDs in their respective formats. |
| NanoId | Compact random string. |
| CUID | Generator with caller/environment and sequence state. |

UUIDv7's local sequence is not a global ordering service across workers or servers. Formats and
brands also do not provide authorization: an accepted identifier still needs the application's
normal lookup and access checks.

For deterministic names, select the namespace deliberately. The same name and namespace derive the
same UUIDv5; different namespaces describe different identity domains.

```ts
import { Effect } from "effect"
import { Ids } from "@typed/id/Ids"

const projectId = Ids.uuid5.url("https://example.com/projects/typed").pipe(
  Effect.provide(Ids.Default),
)

await Effect.runPromise(projectId)
```

Some generators expose `Cause.IllegalArgumentError` for invalid time or namespace inputs. Providing
a Layer satisfies service requirements; it does not erase that error channel.

## Decode external IDs through their schema

A branded ID type helps prevent accidentally mixing formats in TypeScript. Use its schema when an
ID arrives from JSON, a URL, or storage; a type assertion would skip validation.

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

These brands identify formats, not domain entities. If an invoice ID and a customer ID both use
UUIDv7, add your own domain distinction where mixing them would be a bug.

## Make tests repeatable without changing production imports

Import `IdsTest` from `@typed/id/IdsTest`. Each Layer construction owns a deterministic sequence
and fixed generator time. The test helper is deliberately separate from production `Ids` imports.

```ts
import { Effect } from "effect"
import { Ids } from "@typed/id/Ids"
import { IdsTest } from "@typed/id/IdsTest"

const pair = Effect.gen(function* () {
  return [yield* Ids.uuid7, yield* Ids.uuid7] as const
})

const first = await Effect.runPromise(pair.pipe(Effect.provide(IdsTest({ currentTime: 0 }))))
const repeated = await Effect.runPromise(pair.pipe(Effect.provide(IdsTest({ currentTime: 0 }))))

console.log(first[0] !== first[1], first[0] === repeated[0]) // true, true
```

`currentTime` sets the generator's fixed date; the Layer also provides TestClock, but advancing
TestClock does not advance that fixed `DateTimes` service. Provide a custom DateTimes implementation
when a test needs generator time to change.

For server rendering, serialize IDs with the entity and restore those same IDs during hydration.
A deterministic test Layer does not replace that production identity transfer. See
[keyed collections](/explore/keyed-template-collections), [state hydration](/explore/refsubject-template-hydration),
and the [ID reference](/reference/modules/%40typed%2Fid) for the related APIs.


## Diagnose identity changes

When identity appears to change unexpectedly, trace the creation site first. Count generator
executions, inspect whether a route or component is remounted, and check whether sorting code
rebuilds entities with fresh keys. Compare separate test runs only when both the starting generator
state and sequence of generator calls are identical. A deterministic Layer makes that sequence
repeatable; it cannot make different programs consume the same IDs.
