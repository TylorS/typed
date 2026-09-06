---
title: "Compose state around the invariant"
summary: "Build a workspace review model whose writable state, derived selection, and public capabilities agree."
section: "State"
kind: "guide"
order: 2.1
---

The [selection model](/explore/refsubject-renderer-independent-state) becomes more interesting when
an application adds a workspace selector. Changing workspace must clear selected issues. A toolbar
still needs only the selection count, while a bulk action needs the workspace and IDs together.
How should those pieces be represented?

Start with the invariant: selected IDs belong to the current workspace. If the workspace and IDs
are written independently, another consumer can observe the new workspace with the old selection.
Combining refs later does not eliminate that intermediate state. Put values that must change
together in one parent and derive smaller capabilities for consumers.

## Commit related values as one model

```ts
import { Effect, Option } from "effect"
import { RefSubject } from "@typed/fx"

const makeReviewState = Effect.fn("makeReviewState")(function* () {
  const state = yield* RefSubject.make({
    workspaceId: "typed",
    selectedIds: [] as ReadonlyArray<string>,
    focusedId: Option.none<string>(),
  })
  const fields = RefSubject.proxy(state)
  const count = RefSubject.map(fields.selectedIds, (ids) => ids.length)
  const changeWorkspace = (workspaceId: string) => RefSubject.update(state, () => ({
    workspaceId,
    selectedIds: [] as ReadonlyArray<string>,
    focusedId: Option.none<string>(),
  }))
  return { workspaceId: fields.workspaceId, selectedIds: fields.selectedIds, count, changeWorkspace }
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

## Choose whether a missing selection is observable

A focused row may not exist. Keeping Option in state preserves both focus and loss of focus. A
Filtered view is useful for commands or consumers interested only in present IDs.

```ts
import { Effect, Option } from "effect"
import { RefSubject } from "@typed/fx"

const focusModel = Effect.gen(function* () {
  const focusedId = yield* RefSubject.fromOption(Option.none<string>())
  const presentId = RefSubject.compact(focusedId)
  const label = RefSubject.getOrElse(presentId, () => "No focused issue")
  yield* RefSubject.set(focusedId, Option.some("42"))
  return { focusedId, presentId, label }
})
```

Reading `presentId` while absent fails with `NoSuchElementError`; observing it skips absence.
That is useful when an operation requires an ID. A detail pane that must disappear on deselection
should observe the Option-valued source or `presentId.asComputed()`. Otherwise it receives the last
present ID and no later value telling it to clear. The [derived-state guide](/explore/derived-conditional-and-accumulated-state)
explores this distinction and the error channels it creates.

## Avoid copying live values between stores

A common workaround is to observe a parent, copy a field into a child ref, and observe the child to
copy changes back. That creates two writable truths and an ordering problem. Use `map` for a
read-only projection, `transform` for a truly reversible writable representation, or a named parent
transition for edits. See [transactions and bidirectional views](/explore/state-transactions-and-bidirectional-views)
for their different contracts.

When the source is already an Effect, Stream, or Fx, `RefSubject.make` adapts it once in the owning
Scope. `fromEffect`, `fromFx`, and `fromStream` are the explicit source forms; `fromOption` and
`fromNullable` store Option values rather than creating a Filtered view. Captured source services
belong to construction, while later projection services remain requirements of those projections.
The [source guide](/explore/refsubject-sources-equality-and-lifetime) explains initialization timing.

## Expose the composition at the correct boundary

Pass a borrowed Computed directly when a parent builds the consumer. Use
[Context services](/explore/shared-state-contracts) when independent routes, commands, or libraries
need to request the same model. A service declaration is a dependency key; the providing Layer
chooses whether two consumers receive the same instance and how long it lives.

Keep the model's commands named after the domain: `changeWorkspace`, `select`, and `clearSelection`.
Their implementation can choose `set` for replacement, `update` for a next value, `modify` for a
separate command result, or `runUpdates` for several steps inside one serialized ref. `reset` clears
the current slot and returns its previous value as an Option; it does not promise to restart a
completed live source. A resource refresh deserves an explicit request command.

Test the invariant at the public command boundary: change workspace with a nonempty selection,
read the combined model, and observe the published model. Then verify consumers cannot accidentally
write read-only projections in type tests. More state objects are not automatically more modular;
smaller capabilities over a coherent owner often give the better separation.
