---
title: "AsyncData optimistic edits and reconciliation"
summary: "Publish provisional values, preserve rollback history, and decide which server response may commit when edits overlap."
section: "Async data"
kind: "guide"
order: 2.42
---

An optimistic edit shows the user's intended result before the server accepts it. The hard part is
not displaying that value; it is deciding what an acknowledgment or failure means after the user has
already made another edit. AsyncData's Optimistic variant preserves the exact state it replaced,
which gives the application the information needed to implement that policy.

Start with [AsyncData](/explore/async-data) and
[request ownership](/explore/async-data-requests-and-cache). An Optimistic wrapper is data. It does
not start a request, make a write idempotent, retry it, or roll it back when a fiber ends.

## One operation has a simple state transition

```ts
import * as AsyncData from "@typed/async-data"

type Issue = { readonly id: string; readonly title: string; readonly revision: number }
const saved = AsyncData.success<Issue>({ id: "42", title: "Old title", revision: 3 })
const pending = AsyncData.optimistic(saved, { ...saved.value, title: "New title" })
const rollback = pending.previous
const accepted = AsyncData.success({ ...pending.value, revision: 4 })
```

Display `pending.value` while the request runs. On rejection, restoring `pending.previous` retains
the exact earlier state, including its progress or Cause. On acceptance, prefer the server's
canonical value: it may normalize the title, assign an ID, or advance a revision. Committing the
request payload as Success assumes that the server accepted it unchanged.

Rollback and error reporting are separate product decisions. Restoring a successful previous value
removes the optimistic edit, but it does not explain the rejection. Keep a recoverable mutation
error alongside the resource when the user should correct and retry the draft. Replacing everything
with Failure is appropriate only if losing the previous displayed value is intended.

## Guard the commit against a newer local edit

The example below permits one pending save per row. A second call returns `NotReady` while a save is
pending, giving its caller an explicit result rather than silently dropping intent. The saved
response replaces state only if it still owns the exact optimistic wrapper.

```ts
import { Effect, Exit } from "effect"
import * as AsyncData from "@typed/async-data"
import { RefSubject } from "@typed/fx"

type Issue = { readonly id: string; readonly title: string }

const saveTitle = Effect.fn("saveTitle")(function* <E, R>(
  state: RefSubject.RefSubject<AsyncData.AsyncData<Issue, E>>,
  title: string,
  save: (issue: Issue) => Effect.Effect<Issue, E, R>,
) {
  const pending = yield* RefSubject.modify(state, (current) => {
    if (current._tag !== "Success") {
      return [undefined, current] as const
    }
    const next = AsyncData.optimistic<Issue, E>(current, { ...current.value, title })
    return [next, next] as const
  })
  if (pending === undefined) return { _tag: "NotReady" as const }

  const result = yield* Effect.exit(save(pending.value))
  yield* RefSubject.update(state, (current) => {
    if (current !== pending) return current
    return Exit.isSuccess(result) ? AsyncData.success(result.value) : pending.previous
  })
  return Exit.isSuccess(result)
    ? { _tag: "Saved" as const, value: result.value }
    : { _tag: "Rejected" as const, cause: result.cause }
})
```

The identity check is deliberately narrow: this command owns only the wrapper it installed. If
another command replaces the resource, the old completion leaves it alone. The check assumes
nothing else rebuilds that pending wrapper; a revision/operation token is more suitable when other
transitions, refreshes, or serialization must preserve ownership across reconstructed values.

The command's `R` remains the save service requirement. Its expected failures are inspected through
Exit and returned as `Rejected` with the complete Cause. The caller can preserve the draft and
display a rejection message while the shared resource returns to its confirmed value. `Saved`
reports the server result even if a newer resource replaced this command's wrapper before commit;
it does not promise that this row is still the visible selection. Interruption is still a lifetime event: add a
revision-aware cleanup policy if the editor stays alive after cancellation, and do not imply that
canceling the local waiter undoes a server mutation.

## Choose how overlapping edits should behave

Suppose the server holds title A. The user edits B, then C. The local history can be
`Optimistic(C, Optimistic(B, Success(A)))`. If B fails, restoring B's `previous` would discard C.
The history tells you what happened; it does not decide which operation remains meaningful.

| Policy | Suitable interaction | Required behavior |
| --- | --- | --- |
| One pending mutation | Explicit Save button | Keep a draft editable separately; disable/reject another commit until settlement |
| Serialize writes | Ordered edits that must all apply | Queue commands; apply each server response before issuing the next |
| Latest intent with reconciliation | Continuous editing | Track operation/revision identity and reconcile canonical responses without erasing newer intent |
| Rebase pending operations | Multiple optimistic edits over shared data | Retain operations, update the confirmed base, then replay still-pending operations |

Rebasing needs domain operations such as “set title to C” or “increment quantity,” not just a stack
of snapshots. Two increments and two absolute assignments have different merge behavior. Decide
whether the server offers revision checks or idempotency keys and implement that protocol at the
request boundary. AsyncData itself provides neither guarantee.

## Separate the draft from the resource when input can be incomplete

A user may type an invalid intermediate title, cancel editing, or keep typing while Save runs.
Keep raw draft state local to the editor, validate on submission, and publish the accepted candidate
optimistically to the shared resource. Otherwise rolling back a rejected request may erase the
user's newer unsent draft.

For newly created rows, retain a stable client identity through acknowledgment and attach the
server's ID separately when necessary. Replacing a key can remount a row and discard input/focus
state. The [ID guide](/explore/id) connects entity identity to optimistic creation and hydration.

## Keep history bounded and test recovery paths

Each Optimistic wrapper retains its previous state. An editor that pushes a wrapper per keystroke
without settling or compacting history can retain many old payloads. On successful reconciliation,
commit a canonical Success for the confirmed base and retain only operations still pending.

`map` transforms all optimistic values and the successful base. `flatMap` replaces the current
value with whatever state its callback returns; it does not preserve rollback history automatically.
Use `getSuccess` when the current displayed value may be optimistic, and `_tag` when behavior must
specifically distinguish confirmed and provisional values.

Test rejection with a retained prior success, two overlapping intents, stale acknowledgment,
canonical server normalization, route teardown during save, and retry with the original draft.
A successful request test exercises only the easiest path. Keep mutation errors inspectable without
ending the state observation so that a corrected submission can recover in place.
