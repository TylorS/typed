---
title: "Delegate browser events from a renderer"
summary: "Use EventSource when a renderer needs scoped, native delegation across the concrete elements it produced."
section: "Template internals"
kind: "deep-dive"
order: 6
---

A renderer may produce several concrete roots while its event handlers are registered for elements
inside those roots. `EventSource` separates those two facts: a registration names an element and
handler; a mount names the rendered roots whose native listeners receive events.

This is a renderer-author boundary. Application templates should use
[Native events with Effect](/explore/native-events-with-effect). Read
[RenderEvent output](/explore/render-event-substrate) first so the concrete range and its owner are
already defined.

## Register the target, then set up its containing output

```ts
import { Effect, Scope } from "effect";
import * as EventHandler from "@typed/template/EventHandler";
import { makeEventSource } from "@typed/template/EventSource";

const events = makeEventSource();
const root = document.createElement("section");
const button = document.createElement("button");
const icon = document.createElement("span");
icon.textContent = "Save";
button.append(icon);
root.append(button);

const registration = events.addEventListener(
  button,
  "click",
  EventHandler.make((event: MouseEvent) =>
    Effect.log(`Command from ${(event.currentTarget as Element).tagName}`),
  ),
);

export const setup = Effect.flatMap(Scope.Scope, (scope) => events.setup(root, scope));
```

The listener is attached at the concrete rendered root. A click originating on `icon` matches the
registered button through containment. A sibling outside the button does not match merely because
it is in the same root. Register targets actually contained by the output passed to `setup`.

The handler sees a forwarding event with `currentTarget` set to the registered button. Native
properties and methods still forward to the original event with methods bound correctly. The
forwarding object is not identical to the original browser event.

## Keep propagation in the browser

The browser selects capture/bubble behavior and the native target. EventSource checks whether a
registered target is that target or contains it; it does not query a document-wide selector or
reconstruct a component hierarchy.

Consequently, retargeted or composed events across shadow boundaries deserve real browser tests.
A listener outside a shadow tree need not see the target an internal registration expects.
Preserving native semantics does not imply piercing every encapsulation boundary. Test the actual
rendered root, registered element, and event combination your adapter promises.

## Allow registrations and mounts to end independently

`setup(rendered, scope)` installs the native attachments for that mount and gives its started
handler work the same scope. Closing the scope removes those attachments and interrupts running
Effects. It does not erase the registration table, because the renderer-local source may later
mount its output again.

Conversely, disposing `registration` removes that registration from all active mounts. It does
not close those mounts, remove their DOM, or dispose other handlers. A renderer part with a shorter
lifetime than its host should retain and dispose its registration explicitly.

This split also permits late registration:

```ts
import { Effect, Scope } from "effect";
import * as EventHandler from "@typed/template/EventHandler";
import { makeEventSource } from "@typed/template/EventSource";

const events = makeEventSource();
const root = document.createElement("section");
const command = document.createElement("button");
root.append(command);

export const installLate = Effect.flatMap(Scope.Scope, (scope) =>
  Effect.map(events.setup(root, scope), () => events.addEventListener(
    command,
    "click",
    EventHandler.make(() => Effect.log("Late capability invoked")),
  )),
);
```

The new registration attaches to active mounts. Removing a feature can dispose that returned value
while leaving the surrounding panel active. Avoid representing this as a single global "events
mounted" boolean; registration and mount lifetimes genuinely differ.

## Preserve listener options and matching-aware once behavior

```ts
import { Effect } from "effect";
import * as EventHandler from "@typed/template/EventHandler";

const controller = new AbortController();
export const firstSave = EventHandler.make(
  () => Effect.log("First matching save"),
  { once: true, capture: true, signal: controller.signal },
);
export const observeWheel = EventHandler.make(
  (event: WheelEvent) => Effect.log(event.deltaY),
  { passive: true },
);
```

`capture`, `passive`, and `signal` keep their browser meaning. `once` removes a delegated
registration after its first matching event across active mounts; an unrelated event must not
consume it. An aborted signal ends native attachments, while registration disposal also removes
the entry from the source's bookkeeping.

A passive listener cannot cancel default behavior. Typed's pre-handler cancellation options belong
to EventHandler and are applied before its Effect work starts; they are not a new propagation model.

## Test the two lifetimes without inspecting private tables

Start with a contained icon click and an unrelated sibling click. Assert only the contained event
runs the handler and that `currentTarget` is the registered element. Test a late registration against
an already-mounted root and a once handler that survives an unrelated event.

Then install two registrations and dispose one; the other should remain active. Mount two roots
under separate scopes and close one; the other should still receive its matching events. Finally
close the remaining scope and verify no handler work starts, including when dispatching against an
old retained element object.

These tests establish containment, forwarding, native options, and independent cleanup through the
public [EventSource contract](/reference/modules/%40typed%2Ftemplate%2FEventSource). They give a
renderer useful guarantees without coupling its application users to delegation internals.
