---
title: "RefSubject: build the model before the view"
summary: "Develop a review-queue selection model with named commands, derived queries, typed consumers, and a lifetime that matches the feature."
section: "State"
kind: "concept"
order: 2
---

A review queue needs to remember which issues are selected. A row checkbox changes selection; the
bulk-action toolbar reads its count; a keyboard command selects another issue; a test needs to
verify that selecting the same issue twice does not duplicate it. These are different consumers of
one model. None of them should have to mount a component to ask what is selected.

`RefSubject` is that model's writable state boundary. It retains a current value, publishes distinct
commits to observers, and serializes writes. It is both an Effect for “read the current selection”
and an Fx for “follow selection changes.” A UI is one consumer of those capabilities.

Start with the invariant: selection contains each ID at most once. Then decide who can change it,
which queries consumers need, and how long selection should survive. Choosing those contracts first
makes the template smaller and the behavior easier to test.

## Give selection named commands

```ts file="Selection.ts"
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

export const makeSelection = Effect.fn("makeSelection")(function* () {
  const state = yield* RefSubject.make<ReadonlyArray<string>>([])
  // Consumers can follow selection without bypassing its commands to write the array.
  const selectedIds = RefSubject.map(state, (ids) => ids)
  const count = RefSubject.map(state, (ids) => ids.length)

  // Check membership inside the serialized update so concurrent additions are not lost.
  const select = (id: string) => RefSubject.update(state, (ids) =>
    ids.includes(id) ? ids : [...ids, id],
  )
  const remove = (id: string) => RefSubject.update(state, (ids) =>
    ids.filter((selected) => selected !== id),
  )
  const clear = RefSubject.set(state, [])

  return { selectedIds, count, select, remove, clear }
})
```

Only the model closes over the writable ref. Its consumers receive read-only `Computed` views and
commands. Calling `select("42")` creates an Effect description; running that Effect performs the
transition. The command checks membership against committed state inside `update`, so two callers
do not independently read the same old array and overwrite one another's additions.

`map` creates a query over the source, not a second mutable store. A separate writable `count` would
need updating in `select`, `remove`, and `clear`; forgetting any one path would make the toolbar
wrong. Deriving the count keeps that relationship true by construction.

The array is immutable by convention. Returning the existing array for an already selected ID
expresses that nothing changed. Do not mutate an array in place and then call `set` with that same
array: the retained “previous” value would already contain the mutation, so equality could no
longer compare the old and new states meaningfully.

## Read a value or observe a relationship

A command often needs a snapshot. The toolbar needs future changes. The same ref/view supports
both, and the caller chooses which operation it means.

```ts
import { Effect } from "effect"
import { Fx, RefSubject } from "@typed/fx"

// A command needs a snapshot from the moment it runs.
const describeCurrentSelection = (ids: RefSubject.Computed<ReadonlyArray<string>>) =>
  Effect.map(ids, (current) => `${current.length} issues selected`)

// A displayed label also needs later commits, without constructing another model.
const selectionLabels = (ids: RefSubject.Computed<ReadonlyArray<string>>) =>
  Fx.map(ids, (current) => `${current.length} issues selected`)
```

The Effect samples when it runs. The Fx description emits current selection and follows later
commits when a consumer runs it. Merely constructing either description starts no subscription.
`Fx.observe` is an appropriate long-lived consumer; `Fx.collectAll` would wait forever for a live
selection model that never ends. Use a bounded collector in a test.

This difference matters when passing values between functions. Passing `yield* count` passes a
number that will not update. Passing `count` passes a live read-and-observe capability. Neither is
universally better: an API request should usually use a deliberate snapshot, while a displayed
selection count should usually remain live.

## Let a component borrow the model

The toolbar does not need write access to selection. It needs a count and a clear command.

```ts
import type { Effect } from "effect"
import { RefSubject } from "@typed/fx"
import { html } from "@typed/template"
const SelectionToolbar = <E, R>(model: {
  readonly count: RefSubject.Computed<number, E, R>
  readonly clear: Effect.Effect<unknown, E, R>
}) => {
  const empty = RefSubject.map(model.count, (count) => count === 0)
  return html`<div aria-label="Selection actions">
    <span>${model.count} selected</span>
    <button ?disabled=${empty} onclick=${model.clear}>Clear selection</button>
  </div>`
}
```

The count is interpolated as live state. The click binding receives an Effect, so rendering does
not clear selection. The template keeps the model's error and service requirements inferred. A plain function is
sufficient because this view borrows the model and acquires no resources. A component owner belongs
where setup actually needs to run.

The toolbar's shape is small enough to reuse with another selection model. A test can construct the
model and call `clear`; a keyboard binding can run the same command. No event-specific copy of the
selection invariant is necessary.

## Give the feature its real lifetime

Constructing a RefSubject requires Scope. That Scope owns the state source and its observers'
relationship to the source. For selection that should disappear with one page, create the model
inside that page's component. For selection that should survive switching between list and detail
routes, construct it in the feature owner above those routes and pass it down or expose a service.

Closing a short `Effect.scoped` block immediately after returning a ref closes its owner. It does
not create permanent state merely because another object still references the ref. Keep construction
inside the lifetime that will actually use it; current reads and writes of an existing ref do not
need another construction Scope.

The initial array here is available immediately when construction runs. A ref built from an Effect
initializes lazily on its first read/observation; a ref built from Fx or Stream starts its source when
construction runs. Those different start times matter for live data, so continue with
[sources, equality, and lifetime](/explore/refsubject-sources-equality-and-lifetime) before substituting
a remote producer for the plain initial value.

## Test commands before testing rendered bindings

The test below checks the invariant and the derived query in one scoped program. It deliberately
selects the same issue twice: the important behavior is uniqueness, not that `update` was called.

```ts file="Selection.test.ts"
import { Effect } from "effect"
import { expect, it } from "vitest"
import { makeSelection } from "./Selection.js"

it("keeps selection unique and derives its count", Effect.fn(function* () {
  const model = yield* makeSelection()
  yield* model.select("42")
  yield* model.select("42")
  yield* model.select("43")
  expect(yield* model.selectedIds).toEqual(["42", "43"])
  expect(yield* model.count).toBe(2)
  yield* model.clear
  expect(yield* model.count).toBe(0)
}, Effect.scoped, Effect.runPromise))
```

This test imports the actual model rather than reproducing its implementation. Put the two named
files beside one another and run the test with Vitest.
Add a separate observation test when asserting reactive behavior: start a bounded Fx consumer, wait
until it is subscribed, then issue commands. A passing current-read test does not prove that a
publication occurred. Conversely, an equivalent write can be correct even when it publishes nothing.

If the toolbar looks stale, inspect the command, current read, and publication before the DOM.
A correct current value with no update can indicate overly broad equality; two different current
values in two consumers can indicate two separately constructed models; a stopped source can indicate
a closed owner. Those are model/lifetime problems with different fixes.

## Grow the model at its invariants

If selection must clear when the workspace changes, commit workspace and selection together in one
parent ref. If selected rows can disappear from a refreshed catalog, choose whether to prune selection
or retain missing IDs for later reconciliation. These are domain transitions, not display projections.
[Composing state](/explore/composing-refsubject-state) develops the parent-model boundary.

An empty selection is still a valid value. A particular selected row may instead be absent, which
calls for an Option-valued or Filtered view. [Derived state](/explore/derived-conditional-and-accumulated-state)
explains why skipping absent values differs from publishing deselection.

Finally, selection is state, not an event log. Clicking an already selected row may be an event even
when the selected IDs do not change. Keep repeated intent in an event source or command and keep the
result in RefSubject. For a command that performs remote work, represent its loading, failure, and
optimistic results with [AsyncData](/explore/async-data), while the
[shared-contract guide](/explore/shared-state-contracts) shows how independently built consumers can
receive one model without gaining arbitrary write access.
