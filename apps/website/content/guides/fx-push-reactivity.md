---
title: "Fx: work arrives"
summary: "Compose work declaratively over time, with Effect fibers, interruption, and scoped cleanup."
section: "Fx"
kind: "concept"
order: 1
---

<span id="follow-the-search-feature-through-the-curriculum"></span>

`Fx` is a declarative way to compose work over time. Describe what starts work, which executions
may overlap, when old work becomes obsolete, and when everything should stop. The composed program
carries out those rules as values arrive.

Effect supplies fibers, interruption, and scopes. Fx builds on them to coordinate producer
executions and their lifetimes: it acts as a fiber-management system over the dimension of time.
Its combinators express those relationships without requiring each application to track and
interrupt child fibers itself.

An `Fx<A, E, R>` describes a producer that can emit zero, one, or many `A` values, report expected
failures of type `E`, and require services `R`. It is lazy: constructing an Fx starts no subscription.
A runner such as [`Fx.observe`](/reference/symbols/QHR5cGVkL2Z4L0Z4I29ic2VydmU) returns the Effect
that executes it. The owner of that execution also owns interruption and cleanup.

Keep the [Fx Marble Atlas](/explore/fx-operator-atlas) nearby to compare values, timing, completion,
and interruption visually. Each timeline has **Read this diagram** help for its notation.


| Need | Use | Primary contract |
| --- | --- | --- |
| Create a source from data, time, or callbacks | [Building Fx](/explore/building-fx) | Construct a producer; observation starts its work. |
| Run or collect a producer | [Consuming Fx](/explore/consuming-fx) | Choose completion, result, and ownership. |
| Combine independent sources | [Composing Fx](/explore/composing-fx) | Declare which arrivals produce output. |
| Replace, queue, or overlap work | [Higher-order policies](/explore/fx-higher-order-and-concurrency) | Coordinate inner fibers and interruption. |
| Debounce, poll, or detect silence | [Time and rate](/explore/fx-time-and-rate) | Declare when work or delivery happens. |
| Compare operator behavior visually | [Fx Marble Atlas](/explore/fx-operator-atlas) | See values, completion, and interruption over time. |

## Declare how new input changes running work

Effect can interrupt a request. `Fx.switchMapEffect(load)` composes that capability into a rule:
when another input arrives, interrupt the previous inner execution and run `load` for the new one.
`concatMap` instead waits for each inner to finish; `flatMapConcurrently` limits how many may run
at once. The [higher-order operators](/explore/fx-higher-order-and-concurrency) make these policies
part of the workflow's declaration.

Timing composes the same way. Debounce describes a quiet period before forwarding input;
switching describes what that input does to work already in flight. Their placement determines
when replacement happens. Interruption still follows Effect's cleanup semantics; it does not undo
an external action that already completed.

## Separate events, state, and work

A keystroke is an event. The current query is state. A network request is work. Its result is an
event that can update state. An Fx describes the events and work; it does not automatically remember
a current value for somebody who subscribes later. Use a RefSubject when current readable state is
the capability you need, and a Subject when independently owned code publishes events.

Start with a finite command source so both output and completion are easy to inspect:

```ts
import { Effect } from "effect"
import { Fx } from "@typed/fx"

const shortcuts = Fx.fromIterable(["open-search", "", "open-settings"]).pipe(
  Fx.filter((command) => command.length > 0),
  Fx.map((command) => ({ type: "shortcut", command }) as const),
)

const program: Effect.Effect<ReadonlyArray<{ readonly type: "shortcut"; readonly command: string }>> =
  Fx.collectAll(shortcuts)

const values = await Effect.runPromise(program)

// [{ type: "shortcut", command: "open-search" }, { type: "shortcut", command: "open-settings" }]
```

Running `program` obtains the iterator, offers `open-search`, drops the blank command, then offers
`open-settings`. The collector retains both outputs until the iterable completes. Before the
runner starts, there are no collected values; the pipeline is a description, not an eagerly mapped
array. With an open keyboard listener, the same collector would keep waiting for completion.

A transform wraps delivery: `map` changes each value before forwarding it to the downstream Sink.
It need not allocate an intermediate collection or fork a fiber for each mapped value. Higher-order
operators additionally coordinate inner executions; the operator determines that relationship.

## Give each subscription an owner

Running an ordinary Fx twice starts its producer twice. Assigning it to a constant does not share
work. For a callback source, each subscription registers its own listener and removes that listener
when it ends. [Building Fx](/explore/building-fx#register-the-live-browser-boundary) shows that adapter;
[Subject sharing](/explore/subject-event-publications) covers a deliberately shared connection.

Effects and Fx retain their expected failures and required services throughout composition.
[Services and lifetime](/explore/fx-services-and-lifetime) explains provisioning, and
[recovery](/explore/fx-errors-and-recovery) shows where to handle a failed job so later input survives.
Basic Effect composition is the prerequisite for those lessons.

## Continue with one decision at a time

Build a source in [Building Fx](/explore/building-fx), then learn to
[consume it](/explore/consuming-fx), [transform values](/explore/transforming-fx), and
[combine independent producers](/explore/composing-fx). When a value starts work of its own,
[higher-order work](/explore/fx-higher-order-and-concurrency) makes the admission policy explicit;
[time](/explore/fx-time-and-rate) and [recovery](/explore/fx-errors-and-recovery) add the two common
boundaries. The [API reference](/reference/modules/%40typed%2Ffx) is the complete operator lookup.
