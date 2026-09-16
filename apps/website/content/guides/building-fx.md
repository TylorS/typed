---
title: "Building Fx values"
summary: "Start with the smallest constructor that matches your producer, then add typed failure, services, and cleanup where they actually exist."
section: "Fx"
kind: "guide"
order: 1.1
---

Pick a constructor by what you already have: a value, a computation, an iterable, an Effect,
or a callback API. The choice determines when work starts and how it stops.

Read [Fx: work arrives](/explore/fx-push-reactivity) first. Here, every example builds a source and
leaves its execution with an Effect consumer; construction alone starts nothing.

## Capture a value or compute it when observed

[`Fx.succeed`](/reference/symbols/QHR5cGVkL2Z4L0Z4I3N1Y2NlZWQ) emits an existing value once.
`Fx.sync` computes a value once per subscription. A status panel's fixed label can use `succeed`;
a “requested at” timestamp should use `sync` if it means the time observation actually started.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const constant = Fx.succeed("ready");
const requestedAt = Fx.sync(() => new Date());

const program = Fx.collectAll(requestedAt).pipe(Effect.map(([date]) => date.toISOString()));
```

`succeed(new Date())` would capture construction time instead. This timing difference also applies
to reading a mutable configuration object or the current selection. A thrown exception in `sync`
is a defect; expected decoding failure belongs in `Effect.try`, lifted with `fromEffect`.

## Turn a finite batch into ordered delivery

A list of known workspace IDs can be delivered without inventing a callback protocol:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const ids = Fx.fromIterable(new Set(["ada", "grace", "barbara"]));

const program: Effect.Effect<ReadonlyArray<string>> = Fx.collectAll(ids);

const result = await Effect.runPromise(program);
```

`fromIterable` obtains an iterator per run and awaits each delivery before proceeding. `collectAll`
is safe here because the source completes. Be careful with an already-created generator iterator:
obtaining it again does not rewind it. If each run must enumerate from the beginning, construct the
iterator inside [lazy setup](/explore/fx-dynamic-producers).

## Lift an existing Effect

`fromEffect` emits the Effect's success once and preserves its errors, service requirements, and
interruption behavior:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const decode = Effect.try({
  try: () => JSON.parse('{"ready":true}') as unknown,
  catch: () => "InvalidJson" as const,
});

const decoded: Fx.Fx<unknown, "InvalidJson"> = Fx.fromEffect(decode);

const program = Fx.collectAll(decoded);
```

Running `program` parses the text. Success produces a one-element array; invalid JSON fails the
Effect with `InvalidJson`. The adapter adds no retries or fallback. An Effect that requires an HTTP
client still requires that client after lifting; see the [fetch integration](/integrate/fetch-schema).

`Fx.fail` constructs an expected failure directly; `Fx.die` represents an unexpected invariant
violation. Adapt Promise APIs with `Effect.tryPromise` before lifting them.

For an existing Effect Stream, use `Fx.fromStream`; `Fx.toStream` is the reverse boundary. Both
retain errors, requirements, and finalizers, and remain lazy until consumed. For clock-driven sources,
[time and rate](/explore/fx-time-and-rate) covers `at`, `periodic`, and `fromSchedule` with a complete
TestClock example.

## Register the live browser boundary

A keyboard shortcut source has no natural last value. Its constructor must return the exact cleanup
for the listener installed by that subscription:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const keydowns: Fx.Fx<KeyboardEvent> = Fx.callback((emit) => {
  const onKeydown = (event: KeyboardEvent) => emit.succeed(event);

  document.addEventListener("keydown", onKeydown);

  return Effect.sync(() => document.removeEventListener("keydown", onKeydown));
});

const shortcuts = keydowns.pipe(
  Fx.filter((event) => event.metaKey && event.key === "k"),
  Fx.map(() => "open-search" as const),
);
```

The listener does not exist until observation starts. Closing that observation removes it.
`emit.succeed(event)` starts delivery and returns a Fiber; the browser does not await that Fiber.
Rapid callbacks can therefore overlap even if each observer does asynchronous work. A Subject or
explicit queue can serialize publications when the feature needs it; `callback` does not invent a
queue or backpressure mechanism.

A callback owns only its listener. When it also needs an acquired connection, keep that resource
alive through selected observation with [`Fx.genScoped`](/explore/fx-dynamic-producers#keep-acquisition-alive-through-the-selected-producer).
That lifetime is the dynamic-producer decision, rather than a second constructor pattern here.
Continue with [dynamic producers](/explore/fx-dynamic-producers) when configuration selects the
source, or [consumers](/explore/consuming-fx) to give a live source its owning execution.
