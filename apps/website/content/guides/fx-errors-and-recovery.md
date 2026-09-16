---
title: "Recover typed failures without losing causes"
summary: "Recover a failed job while keeping later input connected, then choose retry and fallback boundaries."
section: "Fx"
kind: "guide"
order: 1.8
---

<span id="translate-a-failure-without-claiming-recovery"></span>

A search request can be unavailable while the search field remains usable. The page may show cached
data, offer a retry, and still accept the next query. A catch around the wrong boundary can instead
replace the entire query subscription and leave future input disconnected.

Read [higher-order work](/explore/fx-higher-order-and-concurrency) first. Start by placing recovery
inside each request; then decide which failures to retry and which fallback to show.

## Recover inside the job so the input stays connected

```ts
import { Effect } from "effect"
import { Fx } from "@typed/fx"

type SearchResult =
  | { readonly _tag: "Results"; readonly query: string; readonly items: ReadonlyArray<string> }
  | { readonly _tag: "Unavailable"; readonly query: string }

const search = (query: string): Effect.Effect<ReadonlyArray<string>, "Offline"> =>
  query === "offline" ? Effect.fail("Offline" as const) : Effect.succeed([`Result for ${query}`])

const request = (query: string) => search(query).pipe(
  Effect.map((items): SearchResult => ({ _tag: "Results", query, items })),
  Effect.catch(() => Effect.succeed<SearchResult>({ _tag: "Unavailable", query })),
  Fx.fromEffect,
)

const results = Fx.fromIterable(["typed", "offline", "effect"]).pipe(Fx.concatMap(request))

const values = await Effect.runPromise(Effect.scoped(Fx.collectAll(results)))

// Results, Unavailable, Results: one failure did not stop later input.
```

Trace all three jobs: `typed` yields Results; `offline` is converted to an Unavailable value inside
its request; `effect` can still start and yield Results. The outer input did not fail. The finite
example uses `concatMap` to expose every outcome; live search commonly uses `switchMap(request)`
so newer input also interrupts obsolete work.

Catching outside the flattened workflow instead replaces that whole failed subscription. The
fallback may complete without reconnecting to future queries. Recovery placement and concurrency
policy are separate choices: first decide what must stay alive, then what competing work may run.
Use [AsyncData](/explore/async-data) when loading and refreshing belong in the displayed value model.

## Name the failure a caller can act on

`E` describes expected failures; the complete `Cause<E>` can also contain defects and interruption.
An unavailable request is a domain decision. A broken decoder is a programming problem. Navigation
interrupting an old request is the owner finishing with that work. They should not all produce the
same offline banner.

```ts
import { Data, Effect, Schedule } from "effect";
import { Fx } from "@typed/fx";

class Offline extends Data.TaggedError("Offline")<{}> {}

const search = (query: string) => Fx.fromEffect(
  query === "offline" ? Effect.fail(new Offline()) : Effect.succeed([`Result for ${query}`]),
);

const request = (query: string) => Fx.retry(search(query), Schedule.recurs(2)).pipe(
  Fx.catchTag("Offline", () => Fx.succeed<ReadonlyArray<string>>([])),
);
```

Here an unavailable request gets two retries, then an empty-results fallback. In a UI, distinguish
unavailable from genuinely empty results when that matters; the first example used an explicit tag.
`catchTag` handles only its named expected failure. Other tags remain in the failure channel.

```fx-marble
title: catch aliases switch to a fallback after the source fails
covers: catch, catchAll, catch_
input source: ^ result . !offline
operator: catch / catchAll / catch_(fallback)
inner fallback: . . . . ^ fallback |
output: . result . . . fallback |
```

`catch`, `catchAll`, and `catch_` are aliases. The source's earlier `result` value stays visible, and
the fallback begins only after `!offline`. Recovery changes future output; it does not retract
already-delivered values.

```fx-marble
title: selective typed catches switch only for a matching failure
covers: catchTag, catchIf, catchTags
input source: ^ result . !Offline
operator: catchTag / catchIf / catchTags (matching failure)
inner fallback: . . . . ^ fallback |
output: . result . . . fallback |
```

`catchTag` selects one tag, `catchTags` selects from a handler table, and `catchIf` uses a predicate.
The illustrated matching failure starts a fallback; an unlisted tag or rejected predicate passes
the original failure through. Normal completion without values never enters a typed catch.

## Retry the request boundary, not arbitrary downstream work

```fx-marble
title: retry preserves prior values and starts a fresh attempt after failure
covers: retry
input attempt 1: ^ partial !offline
input attempt 2: . . . ^ ready |
operator: retry(Schedule.recurs(1))
output: . partial . . ready |
```

The first attempt already emitted `partial`. Retry preserves it, then resubscribes after failure and
forwards the next attempt's `ready`. A real source may repeat a cached snapshot on every attempt,
so retry is not deduplication. `Schedule.recurs(2)` permits two retries after the initial attempt;
this operator resets its retry schedule when a value is emitted.

Each retry starts the entire Fx subscription, including acquisition and finalizers. Use a bounded
schedule and an appropriate delay policy for the actual operation. Retrying an accepted write after
losing its response may repeat the command; server-side idempotency and revision checks are separate
from a client retry schedule.

## Keep failure translation separate from recovery

`mapError` changes the expected error representation without recovering the run. Typed catches
search a terminal Cause for an expected failure; a Cause without one passes through. Replacing a
Cause that also contains a defect or interruption replaces that whole termination, so keep the
fallback at the boundary that owns that decision.

Host-oriented operations such as `catchCause`, `onError`, `exit`, and `result` have different jobs:
replacing a complete Cause, observing failure delivery, or exposing outcomes as data. Consult the
[operator atlas](/explore/fx-operator-atlas) for those contracts instead of adding them to ordinary
request recovery. Successful repetition belongs in [time and rate](/explore/fx-time-and-rate).

For this lesson's behavior, the key check is a request after the failed one: it must still run.
Then choose the [consumer](/explore/consuming-fx) that returns or displays those outcomes.
