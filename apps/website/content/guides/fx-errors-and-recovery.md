---
title: "Recover typed failures without losing causes"
summary: "Translate expected errors, retry subscriptions, and materialize complete outcomes deliberately."
section: "Fx"
kind: "guide"
order: 1.8
---

A search request can be unavailable while the search field remains usable. The page may show cached
data, offer a retry, and still accept the next query. A catch around the wrong boundary can instead
replace the entire query subscription and leave future input disconnected.

Read [higher-order work](/explore/fx-higher-order-and-concurrency) first. This lesson follows one
request failure through retry, fallback, and presentation, then examines the lower-level Cause
operations used by a host or supervisor.

## Name the failure a caller can act on

`E` describes expected failures; the complete `Cause<E>` can also contain defects and interruption.
A missing remote guide is a domain decision. A broken decoder is a programming problem. Navigation
interrupting an old request is the owner finishing with that work. They should not all produce the
same offline banner.

```ts
import { Data, Effect, Schedule } from "effect";
import { Fx } from "@typed/fx";

class GuideUnavailable extends Data.TaggedError("GuideUnavailable")<{
  readonly slug: string;
}> {}

interface Guide {
  readonly slug: string;
  readonly body: string;
}

const fetchGuide = Effect.fn("fetchGuide")(function* (slug: string) {
  const request: Effect.Effect<Guide, GuideUnavailable> =
    slug === "network-down"
      ? Effect.fail(new GuideUnavailable({ slug }))
      : Effect.succeed({ slug, body: "Remote guide" });
  return yield* request;
});

const remoteGuide = (slug: string) => Fx.fromEffect(fetchGuide(slug));

const retriedGuide = (slug: string) => Fx.retry(remoteGuide(slug), Schedule.recurs(2));

const guideWithCache = (slug: string) =>
  retriedGuide(slug).pipe(
    Fx.catchTag("GuideUnavailable", ({ slug }) =>
      Fx.succeed<Guide>({ slug, body: "Cached guide" }),
    ),
  );
```

`GuideUnavailable` carries the affected slug. The Effect performs one request; `fromEffect` turns its
success into one event. The retry wrapper owns attempts, and
[`catchTag`](/reference/symbols/QHR5cGVkL2Z4L0Z4I2NhdGNoVGFn) chooses a cached guide only for the
matching expected failure. Other tags remain in the type channel.

```fx-marble
title: catch aliases switch to a fallback after the source fails
covers: catch, catchAll, catch_
input source: ^ guide . !offline
operator: catch / catchAll / catch_(fallback)
inner fallback: . . . . ^ cached |
output: . guide . . . cached |
```

`catch`, `catchAll`, and `catch_` are aliases. The source's earlier `guide` value stays visible, and
the fallback begins only after `!offline`. Recovery changes future output; it does not retract
already-delivered values.

```fx-marble
title: selective typed catches switch only for a matching failure
covers: catchTag, catchIf, catchTags
input source: ^ guide . !GuideUnavailable
operator: catchTag / catchIf / catchTags (matching failure)
inner fallback: . . . . ^ cached |
output: . guide . . . cached |
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

## Translate a failure without claiming recovery

When the caller owns the fallback decision, change only the expected error representation:

```fx-marble
title: mapError changes the typed failure but keeps values and timing
covers: mapError
input source: ^ guide . !offline
operator: mapError(toDomainError)
output: . guide . !DomainError
```

`mapError` preserves successful values and failure timing. It does not handle defects or interruption.
Changing `offline` to `DomainError` makes a boundary easier to consume, but the run still failed.

A less common channel operation is `flip`:

```fx-marble
title: flip turns typed failures into values and values into failures
covers: flip
input failure: ^ . !offline
input success: ^ . ready |
operator: flip
output failure: . . offline |
output success: . . !ready
```

The two rows are separate runs. A typed failure becomes a successful value; a source success becomes
a typed failure. This is useful when a consumer intentionally asks for failures as its data, not for
ordinary page-level recovery.

## Give a host the complete Cause when it needs one

Typed recovery searches a terminal Cause for an expected failure. If its handler runs, its fallback
replaces that source termination; a Cause without an expected failure passes through. When a Cause
combines expected failure with a defect or interruption, replacing it is broader than relabeling
one error. Use Cause-oriented recovery only where the boundary intentionally makes that decision:

```ts
import { Cause, Data, Effect } from "effect";
import { Fx } from "@typed/fx";

class SubscriptionRejected extends Data.TaggedError("SubscriptionRejected")<{
  readonly reason: string;
}> {}

const recordTermination = Effect.fn("recordTermination")((cause: Cause.Cause<unknown>) =>
  Effect.logError(Cause.pretty(cause)),
);

const source = Fx.fail(new SubscriptionRejected({ reason: "account paused" }));

const hostStatus = source.pipe(
  Fx.catchCause((cause) =>
    Fx.fromEffect(
      recordTermination(cause).pipe(
        Effect.as({ state: "unavailable" as const, detail: Cause.pretty(cause) }),
      ),
    ),
  ),
);
```

```fx-marble
title: catchCause replaces any terminal Cause with one fallback
covers: catchCause
input source: ^ . !decoder-defect
operator: catchCause(recordAndFallback)
inner fallback: . . . ^ unavailable |
output: . . . . unavailable |
```

`catchCause` receives the complete Cause and replaces it with the selected producer. This host records
the cause before producing one status value. The original defect is no longer a downstream failure
if the fallback succeeds.

```fx-marble
title: catchCauseIf recovers only when its Cause predicate matches
covers: catchCauseIf
input source: ^ . !decoder-defect
operator: catchCauseIf(hasDies, fallback)
inner fallback: . . . ^ reported |
output: . . . . reported |
```

`catchCauseIf` uses the same timing but forwards the unchanged Cause when its predicate rejects it.
Neither operator should be a default way to make cancellation look like an ordinary request error.
Cleanup belongs in finalization or `onInterrupt`, not a pretend successful replacement request.

## Observe failures and understand the hook's delivery order

```ts
import { Cause, Data, Effect } from "effect";
import { Fx } from "@typed/fx";

class GuideMalformed extends Data.TaggedError("GuideMalformed")<{
  readonly slug: string;
}> {}

const reportGuideFailure = Effect.fn("reportGuideFailure")((cause: Cause.Cause<GuideMalformed>) =>
  Effect.logError(Cause.pretty(cause)),
);

const checkedGuide = Fx.fail(new GuideMalformed({ slug: "effect-basics" })).pipe(
  Fx.onError(reportGuideFailure),
);

const terminalCauses = Fx.causes(checkedGuide);
```

`onError` forwards the original Cause first, then runs its callback if downstream failure delivery
succeeds. A Sink that interrupts during that delivery can prevent the hook from running. The
callback cannot fail in the typed channel, but its defect can still affect the run. For guaranteed
final-outcome reporting, inspect the owning Effect's Exit rather than relying on this delivery hook.

```fx-marble
title: causes emits only the terminal Cause as a value
covers: causes
input source: ^ guide . !malformed
operator: causes
output: . . . Cause(malformed) |
```

`causes` omits successes and emits the delivered Cause as data. The resulting ordinary terminal
example completes successfully after its Cause value. Defects and interruption remain inside that
value instead of being flattened into an arbitrary string.

## Repeat success and materialize outcomes deliberately

A completed cache scan can run again without having failed:

```ts
import { Schedule } from "effect";
import { Fx } from "@typed/fx";

const scanCache = (workspace: string) => Fx.succeed(`scanned:${workspace}`);

const threeScans = scanCache("typed").pipe(Fx.repeat(Schedule.recurs(2)));
```

`repeat(Schedule.recurs(2))` performs the original scan plus two sequential repeats. Failure stops
repetition; retry is the separate failure policy. Neither operation repeats a particular callback
in isolation or makes its side effects idempotent.

For a consumer that needs successes and failures through one data channel, preserve their wrappers:

```ts
import { Cause, Data, Result } from "effect";
import { Fx } from "@typed/fx";

class GuideUnavailable extends Data.TaggedError("GuideUnavailable")<{
  readonly slug: string;
}> {}

const outcomes: Fx.Fx<Result.Result<string, Cause.Cause<GuideUnavailable>>, never> = Fx.result(
  Fx.fail(new GuideUnavailable({ slug: "error-recovery" })),
);
```

```fx-marble
title: exit materializes values and the terminal Cause without failing
covers: exit
input source: ^ guide . !offline
operator: exit
output: . Exit.succeed(guide) . Exit.failCause(offline) |
```

```fx-marble
title: result materializes values and the terminal Cause without failing
covers: result
input source: ^ guide . !offline
operator: result
output: . Result.succeed(guide) . Result.fail(Cause(offline)) |
```

`exit` and `result` wrap each successful value, then wrap a delivered failure Cause. The outer Fx's
`never` typed error channel means the outcome became data, not that nothing failed. A consumer must
still inspect the wrapper. These diagrams describe ordinary terminating sources; a
[Subject](/explore/subject-event-publications) can publish multiple Causes without closing itself.

Test a matching failure, an unmatched tag, a defect, and owner interruption. Also publish a later
query after a failed request to verify the input remains connected. Count acquisitions and releases
across retries, because correct final output alone cannot reveal a leaked failed attempt. Finish at
[Consuming Fx](/explore/consuming-fx), where the application returns or displays the resulting outcome.
