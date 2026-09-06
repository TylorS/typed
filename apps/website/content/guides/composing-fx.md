---
title: "Composing Fx"
summary: "Coordinate independent producers, then recognize when a value starts work of its own."
section: "Fx"
kind: "guide"
order: 1.5
---

Imagine a search screen. Local edits and server notifications feed its activity log. The current
query and category define its search input. A submit button should use that input without submitting
again whenever the category changes. Each relationship calls for different composition.

[Transforming Fx](/explore/transforming-fx) changed one value at a time. Here the question is which
independent producers belong together and which of them may trigger output. Starting a request for
that output is a later decision about competing work.

## Merge events when each occurrence matters

Local and server activity are peers. Both should appear when they arrive:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const local = Fx.at("saved locally", "5 millis");
const server = Fx.at("saved on the server", "1 millis");

const activity = Fx.merge(local, server);
const messages = await Effect.runPromise(Fx.collectAll(activity));
// ["saved on the server", "saved locally"]
```

```fx-marble
title: merge preserves the timing of independent producers
covers: merge, mergeAll, mergeLeft, mergeRight
input local: local-1 . . local-2 . |
input server: . server-1 . . server-2 |
operator: merge / mergeAll / mergeLeft / mergeRight
output merge: local-1 server-1 . local-2 server-2 |
output mergeLeft: local-1 . . local-2 . |
output mergeRight: . server-1 . . server-2 |
```

Read each event down into its output slot: neither lane waits for the other. `mergeAll` generalizes
to several lanes. `mergeLeft` and `mergeRight` run both but expose only their named side. Completion
waits for both, so a silent live peer can keep the result open after the other finishes. Interrupting
the observation stops both.

## Show cached output before starting the live phase

A cache-first feed has a different promise: finish the snapshot, then subscribe to live updates.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const cached = Fx.fromIterable(["cached: Ada", "cached: Lin"]);
const live = Fx.fromIterable(["live: Grace"]);

const people = Fx.concat(cached, live);
const values = await Effect.runPromise(Fx.collectAll(people));
// ["cached: Ada", "cached: Lin", "live: Grace"]
```

```fx-marble
title: concat and continueWith start the next lane after the first ends
covers: concat, continueWith
input cached: cached . | . .
input live: . . ^ live |
operator: concat / continueWith
output: cached . . live |
```

The live lane’s start chevron follows the cache lane’s return bar. An infinite cache lane would prevent live subscription
entirely. `continueWith` chooses the next producer at that boundary; `concat` already has it.
For constant status markers, framing operators express the same sequence:

```fx-marble
title: append, prepend, and delimit frame one producer
covers: append, prepend, delimit
input values: . value-1 value-2 | .
operator: append / prepend / delimit
output append: . value-1 value-2 end |
output prepend: start value-1 value-2 | .
output delimit: start value-1 value-2 end |
```

`prepend` emits `start` before the source, `append` emits `end` after successful source completion,
and `delimit` does both. An appended value is a normal event, not a finalizer that is guaranteed on
failure or interruption. Keep cleanup in the source's scoped resource contract.

## Combine current query and category

The next request needs a latest value from every input. It must change when either input changes:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const queries = Fx.fromIterable(["effect", "effect v4"]);
const filters = Fx.fromIterable(["guides", "api"]);

const searchInput = Fx.zipLatest(queries, filters);
const states = await Effect.runPromise(Fx.collectAll(searchInput));
```

```fx-marble
title: zipLatest emits after both inputs have a current value
covers: tuple, struct, zipLatest, zipLatestWith
input query: effect . effect-v4 . . |
input filter: . guides . . api |
operator: tuple / struct / zipLatest / zipLatestWith
output tuple / zipLatest: . E+G V4+G . V4+API |
output struct: . query:E+filter:G query:V4+filter:G . query:V4+filter:API |
output zipLatestWith: . search(E,G) search(V4,G) . search(V4,API) |
```

[`zipLatest`](/reference/symbols/QHR5cGVkL2Z4L0Z4I3ppcExhdGVzdA) first waits for both lanes.
`E+G` means query `effect` with category `guides`; `V4+API` is the newer query with category `api`.
`tuple` keeps positional values, `struct` names them, and `zipLatestWith` projects them. Each emits
again when any lane changes after all lanes have supplied an initial value.

If nothing appears, inspect the initial-value requirement before changing the operator. A field
that has not emitted can block the combination while another field changes repeatedly. Supply actual
current state from its owner; a fabricated seed can accidentally trigger a request with invalid data.
The finite fixture illustrates the API, while the diagram makes independently timed changes explicit.

## Make the click the trigger and form data the context

When an action should occur only on a click, latest-value recombination is too eager:

```fx-marble
title: withLatestFrom emits only when its source changes after state is ready
covers: withLatestFrom, withLatestFromWith
input source: source-1 . source-2 . |
input state: . ready . revised |
operator: withLatestFrom / withLatestFromWith
output withLatestFrom: . . source-2+ready . |
output withLatestFromWith: . . label(source-2,ready) . |
```

`withLatestFrom` emits only for the left/source event after supporting state exists. `source-1`
arrives too early and is dropped; `source-2` combines with `ready`. Updating state to `revised`
does not replay a click. Keep the action unavailable until its supporting state is ready when losing
an early click would violate the interaction contract.

Sampling reverses the trigger relationship: it retains source values and emits on sampler ticks.

```fx-marble
title: sample reads the latest source value on each sampler tick
covers: sample
input values: value-1 . value-2 . |
input sampler: . tick . tick x
operator: sample(values, sampler)
output: . value-1 . value-2 |
```

The `tick` reads the latest value; changes between ticks only replace that retained value. Source
completion ends the result and cancels the sampler. This is useful for periodic snapshots of a
changing measurement, not for commands where every occurrence must be handled.

## Preserve position only when position has meaning

`zip` pairs first with first, then second with second. It is appropriate for corresponding protocol
records, not for pairing an event feed with a rarely changing setting:

```fx-marble
title: zip variants pair each next value until a completed lane runs out of values
covers: zip, zipWith, zipLeft, zipRight
input left: left-1 . left-2 . |
input right: . right-1 . right-2 |
operator: zip / zipWith / zipLeft / zipRight
output zip: . L1+R1 . L2+R2 |
output zipWith: . pair(L1,R1) . pair(L2,R2) |
output zipLeft: . left-1 . left-2 |
output zipRight: . right-1 . right-2 |
```

Every output waits for its matching partner. A completed lane can still supply its queued values;
pairing ends when a completion marker is reached after those values. Remaining unmatched inputs
are discarded. `zipWith`, `zipLeft`, and `zipRight` change the output representation, not this
clock. Unmatched inputs wait in queues; a fast lane can therefore retain substantial work.

`mergeOrdered` solves a different ordering problem: subscribe to all lanes now but expose their
values in lane order.

```fx-marble
title: mergeOrdered buffers a faster later lane behind an earlier lane
covers: mergeOrdered
input first: . first . | .
input second: second . . . |
operator: mergeOrdered(first, second)
output: . first . second |
```

Here `second` is already available but waits for the first lane to finish. A first lane that never
finishes prevents later buffered values from appearing. Choose ordered buffering because the feature
requires it, not merely to make a test's output easier to compare.

## Start the current request and replace obsolete ones

Once query and category form a useful input, another producer can do the request. A search result
becomes obsolete when the input changes, so select a switching policy:

```ts
import { Context, Data, Effect } from "effect";
import { Fx } from "@typed/fx";

class SearchFailed extends Data.TaggedError("SearchFailed")<{
  readonly query: string;
}> {}

interface SearchClient {
  readonly search: (query: string) => Effect.Effect<ReadonlyArray<string>, SearchFailed>;
}

const SearchClient = Context.Service<SearchClient>("docs/SearchClient");

const queries = Fx.mergeAll(Fx.at("effect", "0 millis"), Fx.at("effect v4", "5 millis"));
const results = queries.pipe(
  Fx.switchMapEffect((query) => Effect.flatMap(SearchClient, ({ search }) => search(query))),
);

const program = results.pipe(
  Fx.provideService(SearchClient, {
    search: (query) => Effect.as(Effect.sleep("20 millis"), [`result: ${query}`]),
  }),
  Fx.collectAll,
  Effect.scoped,
);

const values = await Effect.runPromise(program);
// [["result: effect v4"]]
```

The first request sleeps for 20 milliseconds; the revised query arrives after 5 and interrupts it.
Only the revised result is delivered. Errors and the `SearchClient` requirement remain visible until
recovered or provided. `Effect.scoped` gives admitted work its owner.

This last step differs from combining independent facts: each input starts work of its own. Continue
with [higher-order policies](/explore/fx-higher-order-and-concurrency) for `flatMapConcurrently`,
`concatMap`, `switchMap`, `exhaustMap`, and `exhaustLatestMap`. In particular, a write that must finish
is a different promise from an obsolete search read.
