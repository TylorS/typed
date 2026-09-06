---
title: "Choose specialized state from the questions it answers"
summary: "Model a review queue's ordered rows, keyed lookup, optional focus, field edits, and settled outcomes with the appropriate RefSubject operations."
section: "State"
kind: "guide"
order: 2.2
---

A review queue has several kinds of state. Rows have order. Selection has unique membership. A
focused issue may be absent. A settings object has named fields. Forcing all of these through an
untyped “store” API makes each caller rediscover the representation's rules.

Specialized RefSubject modules give those representations named transitions and queries. They
retain the same Effect current read, Fx observation, serialized writes, errors, and Scope ownership.
Choose the representation from the model's questions, then choose the helper whose return type
expresses whether it writes, computes a value, or represents absence.

Read [RefSubject's model](/explore/refsubject-renderer-independent-state) first. The specialization
is a vocabulary over that model, not a new state architecture.

## Keep an array when order is meaningful

The queue displays issues in priority order. Appending an issue is a transition; deriving titles is
a query. These should look different in code.

```ts
import { Effect } from "effect"
import * as RefArray from "@typed/fx/RefArray"

type Issue = { readonly id: string; readonly title: string }
const makeQueue = Effect.fn("makeQueue")(function* () {
  const issues = yield* RefArray.make<Issue>([])
  const titles = RefArray.mapValues(issues, (issue) => issue.title)
  const count = RefArray.length(issues)
  yield* RefArray.append(issues, { id: "42", title: "Review the release" })
  return { issues, titles, count }
})
```

`append` runs as an Effect and changes state. `mapValues` returns a Computed and leaves the array
owned by the model. `head`, `last`, and `getIndex` can be absent and therefore produce Filtered views.
An empty queue is a valid array, while “the first issue” may have no current value.

For transitions without a suitable helper, use `RefSubject.update` with an immutable array
transformation. Preserve IDs while editing content so keyed rendering retains row identity.
The current `RefArray.map` declaration says Computed, but its runtime performs a write; use
`mapValues` for projections and `RefSubject.update` for rewrites until that mismatch is corrected.
That specific discrepancy is also a reason to test command versus query behavior at the boundary.

## Use a keyed collection when identity is the frequent query

If the dominant question is “what is issue 42?”, a HashMap avoids treating every lookup as an array
search. Its public operations state the keyed intent.

```ts
import { Effect, HashMap } from "effect"
import * as RefHashMap from "@typed/fx/RefHashMap"

const makeCatalog = Effect.fn("makeCatalog")(function* () {
  const issues = yield* RefHashMap.make(HashMap.empty<string, { readonly title: string }>())
  const selectedExists = RefHashMap.has(issues, "42")
  yield* RefHashMap.set(issues, "42", { title: "Review the release" })
  const beforeRemoval = yield* selectedExists
  yield* RefHashMap.remove(issues, "42")
  return { beforeRemoval, afterRemoval: yield* selectedExists }
})
```

`has` is total boolean state; `get` is conditional because a key may not exist. Keep the map or an
Option-valued projection when a consumer must react to removal, rather than consuming only present
lookup results and accidentally leaving stale output visible.

A HashSet is suitable for unique membership without values. A Record fits string-keyed records.
A Chunk fits an existing Effect Chunk pipeline. If both order and direct lookup are necessary,
choose one authoritative representation and derive the other where practical; independently mutating
an array and map creates a synchronization invariant you must then maintain.

## Keep optional focus explicit

A focused row can disappear when a filter changes. `RefOption` stores both Some and None as ordinary
state. Its present-only view is an optional capability for a particular consumer.

```ts
import { Effect, Option } from "effect"
import * as RefOption from "@typed/fx/RefOption"

const makeFocus = Effect.fn("makeFocus")(function* () {
  const focusedId = yield* RefOption.make(Option.none<string>())
  const label = RefOption.getOrElse(focusedId, () => "No focused issue")
  yield* RefOption.setSome(focusedId, "42")
  const focusedLabel = yield* label
  yield* RefOption.setNone(focusedId)
  return { focusedLabel, emptyLabel: yield* label, focusedId }
})
```

`getValue` produces a Filtered: its current read fails with `NoSuchElementError` while absent, and
its Fx skips absence. The detail pane needs the Option to clear itself on deselection; an operation
that only runs for selected IDs can use the Filtered. The
[derived-state guide](/explore/derived-conditional-and-accumulated-state) explains this asymmetry.

## Update fields through their parent invariant

Queue settings belong together because a transition may change more than one setting. `RefStruct`
keeps one model and offers typed field operations.

```ts
import { Effect } from "effect"
import * as RefStruct from "@typed/fx/RefStruct"

const makeSettings = Effect.fn("makeSettings")(function* () {
  const settings = yield* RefStruct.make({ title: "Review queue", compact: false })
  const title = RefStruct.get(settings, "title")
  yield* RefStruct.set(settings, "title", "Release review")
  yield* RefStruct.merge(settings, { title: "Compact review", compact: true })
  return { settings, title }
})
```

`get` is a read-only query; `set` and `update` write one field; `merge` can change several fields in
one parent update. Separate field writes remain separate commits. When the invariant spans fields,
use one merge or parent update rather than relying on the renderer not to notice an intermediate
combination. `RefTuple` provides typed index operations for fixed positional values, while
`RefSubject.proxy` is convenient for read-only field views.

## Distinguish a stored failure from a failed read

A validation Result can contain a domain failure while the ref holding it reads successfully.
`RefResult<A, DomainError, ReadError>` keeps those channels distinct. The validation error is data;
ReadError means accessing the state failed. `RefCause` is useful when the complete Cause is itself
the model. Use [AsyncData](/explore/async-data) instead of Result when first load, refresh, retry,
and optimistic work must be represented as well.

Other modules address particular value semantics:

| Representation | Module family | Boundary to inspect |
| --- | --- | --- |
| Flags/text | `RefBoolean`, `RefString` | Toggle/replace writes versus negation/trim queries |
| Numeric values | `RefBigInt`, `RefBigDecimal` | Exact representation and operation return types |
| Time values | `RefDuration`, `RefDateTime` | Duration units versus timestamp/calendar interpretation |
| Indexed structures | `RefTrie`, `RefGraph`, `RefHashRing` | Missing lookup, structural constraints, distribution semantics |
| Generic iterable values | `RefIterable` | Whether repeated traversal is appropriate for the source |

For example, store a Duration when the model describes elapsed time and derive milliseconds only
at a timer boundary. Choose Graph because relationships are genuinely graph-shaped, not because a
more specialized name sounds like a better store. These modules do not add persistence, cache
invalidation, or network conflict resolution.

When adopting a specialization, test one transition, one query, and the absent/invalid boundary
that matters to the feature. Inspect the actual Effect/Computed/Filtered return type; similar names
across representations need not all mutate or all project. The
[Fx reference](/reference/modules/%40typed%2Ffx) lists the operations, while
[state transactions](/explore/state-transactions-and-bidirectional-views) covers custom transitions
that must return a result or preserve several steps together.
