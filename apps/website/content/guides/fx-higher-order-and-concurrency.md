---
title: "Flatten Fx with an explicit policy"
summary: "Choose whether inner Fx overlap, wait, replace one another, or are ignored."
section: "Fx"
kind: "guide"
order: 1.4
---

A document editor starts several kinds of work: load previews, upload attachments, save revisions,
and submit a final command. A new input arriving while old work is active must have an intentional
meaning. Running everything, canceling old work, and dropping repeated commands are different user
promises, even when all three call the same server.

[Composing Fx](/explore/composing-fx) combined independent producers. Here an outer value creates an
inner Fx. The inner may emit progress and a final result, fail, or remain live. A flattening operator
owns the relationship between those runs.

## Let independent attachment work overlap

When one input's work does not invalidate another's, `flatMap` starts every inner immediately:

```ts
import { Fx } from "@typed/fx";

const requests = Fx.mergeAll(
  Fx.at("a", "0 millis"),
  Fx.at("b", "5 millis"),
);

const load = (id: string) =>
  Fx.mergeAll(
    Fx.at(`${id}:cached`, "10 millis"),
    Fx.at(`${id}:fresh`, "40 millis"),
  );

const results = requests.pipe(Fx.flatMap(load));
```

```fx-marble
title: flatMap runs every inner and lets their values interleave
covers: flatMap
input: a . b . . . . . |
operator: flatMap(load)
inner a: ^ a1 . . a2 | . . .
inner b: . . ^ b1 . b2 | . .
output: . a1 . b1 a2 b2 . . |
```

The `b` lane starts while `a` is still active. Both cached and fresh values survive, and the output
interleaves them. There is no ordering between different inners. This policy can create an unbounded
number of active jobs if input keeps arriving faster than jobs finish.

For uploads, bound active jobs while retaining every selected file:

```ts
import { Fx } from "@typed/fx";

const attachments = Fx.fromIterable(["a", "b", "c"]);

const upload = (file: string) =>
  Fx.mergeAll(
    Fx.succeed(`${file}:opened`),
    Fx.at(`${file}:stored`, "1 second"),
  );

const uploads = attachments.pipe(Fx.flatMapConcurrently(upload, 2));
```

```fx-marble
title: flatMapConcurrently waits when every permit is occupied
covers: flatMapConcurrently
input: a b c . . . . . |
operator: flatMapConcurrently(load, 2)
inner a: ^ a1 . a2 | . . . .
inner b: . ^ b1 . b2 | . . .
inner c: . . . . . ^ c1 c2 |
output: . a1 b1 a2 b2 . c1 c2 |
```

Two permits admit `a` and `b`; `c` waits until a permit becomes available. The tightly spaced input
lanes depict concurrent source deliveries that can wait for admission; a sequential producer cannot
issue its next input while its current delivery is still waiting. The bound limits active
work, not all retained inputs. A large waiting population still consumes memory. The concurrency
argument must be a positive safe integer; an invalid value fails with `Cause.IllegalArgumentError`.

## Preserve every revision in order

A protocol that must apply revision `a` before `b` needs sequential admission:

```ts
import { Fx } from "@typed/fx";

const revisions = Fx.fromIterable(["a", "b", "c"]);

const save = (revision: string) =>
  Fx.mergeAll(
    Fx.succeed(`${revision}:accepted`),
    Fx.at(`${revision}:stored`, "20 millis"),
  );

const auditTrail = revisions.pipe(Fx.concatMap(save));
```

```fx-marble
title: concatMap finishes each inner before starting the next
covers: concatMap
input: a b c . . . . . . |
operator: concatMap(save)
inner a: ^ a1 a2 | . . . . . .
inner b: . . . ^ b1 b2 | . . .
inner c: . . . . . . ^ c1 c2 |
output: . a1 a2 . b1 b2 . c1 c2 |
```

`concatMap` waits for each inner to complete before starting the next. Both its progress and stored
result arrive before the next revision starts. An infinite first inner prevents every later revision
from starting; a rapidly growing input backlog increases latency even with only one active job.
Use this because every command matters, not as a generic solution to concurrency.

## Replace an obsolete preview

A revised document makes the previous preview irrelevant. `switchMap` stops future work from that
old input while preserving anything it already emitted:

```ts
import { Fx } from "@typed/fx";

const drafts = Fx.mergeAll(
  Fx.at("initial", "0 millis"),
  Fx.at("revised", "5 millis"),
);

const preview = (draft: string) =>
  Fx.mergeAll(
    Fx.at(`${draft}:started`, "1 millis"),
    Fx.at(`${draft}:ready`, "20 millis"),
  );

const previews = drafts.pipe(Fx.switchMap(preview));
```

```fx-marble
title: switchMap interrupts the old inner exactly when its replacement arrives
covers: switchMap
input: a . b . . . |
operator: switchMap(preview)
inner a: ^ a1 x . . . .
inner b: . . ^ b1 . b2 |
output: . a1 . b1 . b2 |
```

`b` causes the `x` in `a`'s lane. `a1` remains because it arrived before the switch; `a2` never arrives.
Switching waits for interruption and finalizers before starting the replacement, so a slow finalizer
can delay the next raised start chevron beyond this idealized timeline.

This is a good contract for previews and current search results. It is not a rollback mechanism:
interrupting local work does not undo a command already accepted by a server. Connect cancellation
to the foreign API in [the source adapter](/explore/building-fx), and handle write idempotency or
revision checks in the server protocol.

## Ignore repeated submit clicks while the command is active

If an in-flight submit already represents the user's intent, ignore busy arrivals:

```ts
import { Fx } from "@typed/fx";

const submits = Fx.mergeAll(
  Fx.at("first", "0 millis"),
  Fx.at("ignored", "5 millis"),
  Fx.at("later", "30 millis"),
);

const submit = (command: string) => Fx.at(`saved:${command}`, "20 millis");

const accepted = submits.pipe(Fx.exhaustMap(submit));
```

```fx-marble
title: exhaustMap ignores arrivals until the active inner completes
covers: exhaustMap
input: a b . . c . . . |
operator: exhaustMap(submit)
inner a: ^ a1 . a2 | . . .
inner c: . . . . ^ c1 . c2 |
output: . a1 . a2 . c1 . c2 |
```

There is no `b` inner because it never starts. `exhaustMap` does not keep it for later. When `a`
finishes, a later `c` may start. This prevents repeated local submissions while busy, but it does not
provide a global exactly-once guarantee across retries, devices, or server responses.

## Finish the current save, then save only the newest snapshot

Some autosave protocols require nonoverlapping writes but do not need every intermediate snapshot:

```ts
import { Fx } from "@typed/fx";

const versions = Fx.mergeAll(
  Fx.at("v1", "0 millis"),
  Fx.at("v2", "5 millis"),
  Fx.at("v3", "10 millis"),
);

const index = (version: string) => Fx.at(`indexed:${version}`, "20 millis");

const indexed = versions.pipe(Fx.exhaustLatestMap(index));
```

```fx-marble
title: exhaustLatestMap keeps only the newest value waiting behind active work
covers: exhaustLatestMap
input: a b c . . . . . |
operator: exhaustLatestMap(index)
inner a: ^ a1 . a2 | . . . .
inner c: . . . . . ^ c1 c2 |
output: . a1 . a2 . . c1 c2 |
```

`b` first becomes pending, then `c` replaces it. `exhaustLatestMap` finishes `a` and then starts `c`.
It never cancels the active write. This is appropriate only when intermediate snapshots are
replaceable; dropping an intermediate command that changes meaning is a different feature.

For arrivals at 0, 5, and 10 milliseconds and 20-millisecond jobs, immediate-finalization assumptions
give these outcomes: `concatMap` finishes all three at 60; `switchMap` locally finishes only `c` at
30; `exhaustMap` finishes only `a` at 20; `exhaustLatestMap` finishes `a` then `c` at 40. The choice
changes what the user ultimately saved, not just throughput.

## Select a branch or a winning source directly

Sometimes the competitors are already known. `if` switches between branches whenever its boolean
input changes:

```fx-marble
title: if switches from the true branch to the false branch
covers: if
input condition: true . false . |
operator: if(condition, { onTrue, onFalse })
inner onTrue: ^ enabled x . .
inner onFalse: . . ^ disabled |
output: . enabled . disabled |
```

The true branch is interrupted when `false` arrives. The selected branch remains active until it
ends or is replaced. Source completion waits for the selected branch to finish.

`race` and `raceAll` instead choose the first producer that emits a value:

```fx-marble
title: race cancels slow once fast emits first
covers: race
input competitors: slow+fast . . |
operator: race(slow, fast)
inner slow: ^ x . .
inner fast: ^ fast |
output: . fast |
```

```fx-marble
title: raceAll keeps fast and cancels the other candidates
covers: raceAll
input candidates: slow+fast+mid . . |
operator: raceAll(slow, fast, mid)
inner slow: ^ x . .
inner fast: ^ fast |
inner mid: ^ x . .
output: . fast |
```

The first `fast` value selects its lane and interrupts every loser. Completion or failure without
a value does not select a winner. The winner can continue producing afterward. This is different
from racing ordinary Effects for a first completion.

## Use Effect callbacks for one-result jobs

An inner Fx can emit progress and a result; an Effect callback can produce at most one success.
The `*Effect` convenience variants lift that one result without changing admission policy:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

type Revision = { readonly id: string };

const save = Effect.fn(function* (revision: Revision) {
  yield* Effect.log(`saving ${revision.id}`);
  return revision.id;
});

const revisions = Fx.fromIterable<Revision>([{ id: "a" }, { id: "b" }]);

const explicit = revisions.pipe(
  Fx.concatMap((revision) => Fx.fromEffect(save(revision))),
);

const convenient = revisions.pipe(Fx.concatMapEffect(save));
```

`explicit` and `convenient` preserve the same revision order. The following timelines deliberately
have only one success token per admitted Effect; a multi-value inner-Fx timeline would misrepresent
this cardinality.

```fx-marble
title: flatMapEffect emits at most one success for each admitted Effect
covers: flatMapEffect
input: a b . . . |
operator: flatMapEffect(save)
inner a: ^ . . saved-a |
inner b: . ^ saved-b |
output: . . saved-b saved-a . |
```

Unbounded admission permits `saved-b` to finish before `saved-a`.

```fx-marble
title: flatMapConcurrentlyEffect emits at most one success for each admitted Effect
covers: flatMapConcurrentlyEffect
input: a b c . . . . |
operator: flatMapConcurrentlyEffect(save)
inner a: ^ . saved-a |
inner b: . ^ . saved-b |
inner c: . . . ^ . saved-c |
output: . . saved-a saved-b . saved-c . |
```

With two permits, `c` starts only after an active job releases one.

```fx-marble
title: concatMapEffect emits at most one success for each admitted Effect
covers: concatMapEffect
input: a b c . . . . . |
operator: concatMapEffect(save)
inner a: ^ . saved-a |
inner b: . . . ^ saved-b |
inner c: . . . . . ^ saved-c |
output: . . saved-a . saved-b . saved-c . |
```

Sequential admission emits one saved result before the next job starts.

```fx-marble
title: switchMapEffect emits at most one success for each admitted Effect
covers: switchMapEffect
input: a b . . |
operator: switchMapEffect(save)
inner a: ^ x
inner b: . ^ . saved-b |
output: . . . saved-b |
```

Switching interrupts `a`; only `b` produces a successful result.

```fx-marble
title: exhaustMapEffect emits at most one success for each admitted Effect
covers: exhaustMapEffect
input: a b . . c . . |
operator: exhaustMapEffect(save)
inner a: ^ . saved-a |
inner c: . . . . ^ saved-c |
output: . . saved-a . . saved-c . |
```

The busy `b` input has no inner lane and no result.

```fx-marble
title: exhaustLatestMapEffect emits at most one success for each admitted Effect
covers: exhaustLatestMapEffect
input: a b c . . . |
operator: exhaustLatestMapEffect(save)
inner a: ^ . . saved-a |
inner c: . . . . ^ saved-c |
output: . . . saved-a . saved-c |
```

Only the latest waiting input `c` runs after active `a` finishes.

All policies combine outer and inner error/service channels and require a Scope owning admitted and
waiting work. Put request recovery inside the mapper when later input should survive that failure;
[errors and recovery](/explore/fx-errors-and-recovery) works through that placement. Count starts,
completions, and finalizers separately when testing: an absent result can mean never admitted,
interrupted, or failed. [Services and lifetime](/explore/fx-services-and-lifetime) gives these runs
the owner that ends them when the editor closes.
