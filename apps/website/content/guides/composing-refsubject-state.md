---
title: "Compose state around the invariant"
summary: "Build a workspace review model whose writable state, derived selection, and public capabilities agree."
section: "State"
kind: "guide"
order: 2.1
---

<span id="choose-whether-a-missing-selection-is-observable"></span>

Changing workspace must also clear its selected IDs. Put both values in one RefSubject so
consumers observe one valid transition, then derive the read-only views each consumer needs.
This extends the [selection model](/explore/refsubject-renderer-independent-state).

If workspace and IDs are written independently, a consumer can observe the new workspace with the
old selection. Combining refs later cannot remove that intermediate state. Use `struct` or `tuple`
for values whose updates really are independent.


| Need | Use | Primary contract |
| --- | --- | --- |
| Change related fields as one valid transition | [One parent model](#commit-related-values-as-one-model) | One serialized update preserves the shared invariant. |
| Read several independently owned values together | [Combine capabilities](#combine-independent-capabilities-for-a-consumer) | A combined view does not make separate writes atomic. |
| Expose queries without arbitrary writes | [Commands and derived views](#expose-commands-and-derived-views) | Keep mutation authority with the owner. |

## Commit related values as one model

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

const makeReviewState = Effect.fn("makeReviewState")(function* () {
  const state = yield* RefSubject.make({
    workspaceId: "typed",
    selectedIds: [] as ReadonlyArray<string>,
  })

  const fields = RefSubject.proxy(state)
  const count = RefSubject.map(fields.selectedIds, (ids) => ids.length)

  const changeWorkspace = (workspaceId: string) => RefSubject.update(state, () => ({
    workspaceId,
    selectedIds: [] as ReadonlyArray<string>,
  }))
  const select = (id: string) => RefSubject.update(state, (current) =>
    current.selectedIds.includes(id) ? current : {
      ...current, selectedIds: [...current.selectedIds, id],
    },
  )

  return { workspaceId: fields.workspaceId, selectedIds: fields.selectedIds, count, select, changeWorkspace }
})
```

One `update` expresses the workspace transition. `proxy` creates memoized field-view objects as
properties are accessed; it does not split the parent into separately writable stores or cache old
field values. The count remains derived from the same selection. `RefStruct` provides typed field
writes when a caller owns that authority; `proxy` is useful when consumers should only read fields.

Keeping a parent object does not mean every application value belongs there. Audio-player state and
a temporary search input can have independent owners. Group by invariant and lifetime, not merely
by which screen happens to render the values.

## Combine independent capabilities for a consumer

Suppose a search box and a display-density preference really are independent. A view can combine
them without inventing another synchronization process.

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

const model = Effect.gen(function* () {
  const query = yield* RefSubject.make("")
  const density = yield* RefSubject.make("comfortable")

  const normalized = RefSubject.map(query, (value) => value.trim().toLowerCase())
  const presentation = RefSubject.struct({ query: normalized, density })
  const rawInputs = RefSubject.tuple([query, density])

  return { presentation, rawInputs, query, density }
})
```

`struct` preserves property names; `tuple` preserves positional types. They combine current reads
and pushed values. Their writable capability depends on every input:

| Inputs | Combined result | Consequence |
| --- | --- | --- |
| All writable RefSubjects | RefSubject | Consumer can write the combined representation |
| At least one Computed, no Filtered | Computed | Consumer can only read and observe |
| At least one Filtered | Filtered | Current read may be absent; observations skip absent combinations |

`presentation` is read-only because its normalized query is read-only. `rawInputs` is writable
because both inputs are writable. Input errors and services form unions; adding a service-backed
input adds that requirement to the combined capability. A composition does not silently satisfy it.

Independent writers remain independent. Do not treat `struct` as a global transaction manager for
a set of separately changing refs. The parent-object model above is clearer when a transition must
preserve a cross-field invariant.

## Expose commands and derived views

Keep the writable parent private and return named transitions plus the read-only fields consumers
need. Avoid copying fields into separate writable refs: that introduces synchronization work and
allows the two representations to disagree.

Test the public transition: run `select("42")`, then `changeWorkspace("next")`. Both a current read
and an observation should show the new workspace with no selected IDs. Testing the combined value
is what checks the invariant; testing each field separately can miss an invalid intermediate state.

For a field that may be absent, continue with [derived and optional state](/explore/derived-conditional-and-accumulated-state).
For consumers that request the same model through Context, see [shared state contracts](/explore/shared-state-contracts).
