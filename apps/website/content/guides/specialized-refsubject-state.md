---
title: "Choose specialized state from the questions it answers"
summary: "Choose RefSubject helpers for ordered values, keyed lookup, optional focus, field updates, and stored results."
section: "State"
kind: "reference"
order: 2.2
---

Specialized RefSubject modules name the transitions and queries for a particular representation.
They retain the same current read, Fx observation, serialized writes, errors, and Scope ownership.
Use this lookup after [RefSubject's model](/explore/refsubject-renderer-independent-state).

| Need | Representation | Example result kinds |
| --- | --- | --- |
| Preserve order | `RefArray` | `append`: write Effect; `mapValues`: Computed; `head`: Filtered |
| Find a value by identity | `RefHashMap` | `set`: write Effect; `has`: Computed; `get`: Filtered |
| Store presence and absence | `RefOption` | `setNone`: write Effect; `getOrElse`: Computed; `getValue`: Filtered |
| Update named fields together | `RefStruct` | `merge`: write Effect; `get`: Computed |
| Keep a domain failure as data | `RefResult` | A current read returns the stored Result |

A write Effect changes state when executed. A Computed reads or observes a derived value. A
Filtered represents a query that can be absent. Choose the return kind as carefully as the
representation.

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
See the [RefArray reference](/reference/modules/%40typed%2Ffx%2FRefArray) for the current signatures.

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
| Flags/text | [`RefBoolean`](/reference/modules/%40typed%2Ffx%2FRefBoolean), [`RefString`](/reference/modules/%40typed%2Ffx%2FRefString) | Toggle/replace writes versus negation/trim queries |
| Numeric values | [`RefBigInt`](/reference/modules/%40typed%2Ffx%2FRefBigInt), [`RefBigDecimal`](/reference/modules/%40typed%2Ffx%2FRefBigDecimal) | Exact representation and operation return types |
| Time values | [`RefDuration`](/reference/modules/%40typed%2Ffx%2FRefDuration), [`RefDateTime`](/reference/modules/%40typed%2Ffx%2FRefDateTime) | Duration units versus timestamp/calendar interpretation |
| Indexed structures | [`RefTrie`](/reference/modules/%40typed%2Ffx%2FRefTrie), [`RefGraph`](/reference/modules/%40typed%2Ffx%2FRefGraph), [`RefHashRing`](/reference/modules/%40typed%2Ffx%2FRefHashRing) | Missing lookup, structural constraints, distribution semantics |
| Generic iterable values | [`RefIterable`](/reference/modules/%40typed%2Ffx%2FRefIterable) | Whether repeated traversal is appropriate for the source |

For example, store a Duration when the model describes elapsed time and derive milliseconds only
at a timer boundary. Choose Graph because relationships are genuinely graph-shaped, not because a
more specialized name sounds like a better store.

When adopting a specialization, test one transition, one query, and the absent/invalid boundary
that matters to the feature. Inspect the actual Effect/Computed/Filtered return type; similar names
across representations need not all mutate or all project. The
[Fx reference](/reference/modules/%40typed%2Ffx) lists the operations, while
[state transactions](/explore/state-transactions-and-bidirectional-views) covers custom transitions
that must return a result or preserve several steps together.
