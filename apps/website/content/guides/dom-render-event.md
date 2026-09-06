---
title: "Using DomRenderEvent"
summary: "Carry exact Nodes, DocumentFragments, Wires, and nested rendered values through a Typed dynamic range without cloning them."
section: "Template internals"
kind: "guide"
order: 2
---

Embedding a canvas should keep the canvas object a chart actually draws into. Rebuilding equivalent
markup would produce another object and lose its drawing context, listeners, or foreign renderer
state. `DomRenderEvent` transports the exact rendered objects into a Typed-owned position.

Read [RenderEvent: any UI can participate](/explore/render-event-substrate) for representation choice.
This page builds a browser adapter whose output and resource lifetime are both explicit.

## Carry the object, not a description of how to recreate it

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { DomRenderEvent } from "@typed/template/RenderEvent";

const canvasOutput = Fx.sync(() => {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 120;
  return DomRenderEvent(canvas);
});
export const activity = html`<section aria-label="Article activity">${canvasOutput}</section>`;
```

Each run creates one canvas lazily. A producer that already has a node can return
`Fx.succeed(DomRenderEvent(node))`, but must account for where that same object may be mounted.
The event neither clones it nor establishes exclusive lifetime ownership by itself.

Its content type is `Rendered`: a Node, DocumentFragment, Wire, or nested readonly collection of
those values. `valueOf()` returns that exact content. A fragment's children move into the document
when inserted; use a persistent range when a multi-node result must remain addressable afterward.

## Acquire the running resource beside the output

A real chart adapter should acquire its chart instance in a scope and call that library's actual
teardown. This smaller example uses an Effect-owned schedule to redraw a canvas:

```ts
import { Effect } from "effect";
import { component } from "@typed/ui/Component";
import { Fx } from "@typed/fx";
import { DomRenderEvent } from "@typed/template/RenderEvent";

export const ClockCanvas = component(function* (document: Document) {
  const canvas = yield* Effect.sync(() => document.createElement("canvas"));
  canvas.width = 320;
  canvas.height = 60;

  const paint = Effect.sync(() => {
    const context = canvas.getContext("2d");
    if (context === null) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillText(new Date().toLocaleTimeString(), 8, 30);
  });

  yield* paint;
  // The component's child scope owns the recurring work.
  yield* Fx.periodic("1 second").pipe(
    Fx.observe(() => paint),
    Effect.forkScoped,
  );

  return DomRenderEvent(canvas);
});
```

The component returns the event directly. Scheduled ticks redraw the same canvas without emitting
replacement nodes. Interruption closes the component's
[Effect scope](https://github.com/Effect-TS/effect/blob/main/packages/effect/src/Scope.ts) and interrupts
the periodic producer. The canvas has
no magic disposer attached by `DomRenderEvent`; the resource finalizer is explicit in the producer.

This component deliberately depends on a browser Document. Canvas pixels do not serialize into an
equivalent server HTML view. A cross-target library should supply a distinct server representation
through its service boundary rather than pretend the browser resource can run on the server.

## Divide placement from foreign internals

The containing template owns the position where the canvas appears. Its dynamic range can insert,
move, or remove the represented output. It does not redraw the canvas, rewrite foreign descendants,
or remove unrelated siblings outside that range.

A chart library that changes descendants within its host remains responsible for them. A parent
that replaces the host's `innerHTML` would violate that division. A chart requiring a connected host
also needs explicit mount coordination; creating its node during component setup does not prove it
is connected or laid out yet.

For callback-based producers, `Fx.callback` can model the actual subscribe/unsubscribe API and
return a cleanup Effect. Avoid inventing another lifetime based solely on observing DOM removal:
a moved or detached object is not necessarily a stopped resource.

## Be careful when inspecting mounted ranges

`DomRenderEvent.toString()` serializes current output; it does not turn a DOM event into HTML
transport. For Wire content, serialization can consume `valueOf()` and gather nodes into a fragment.
Do not use that conversion as an innocent logging statement on mounted output.

Inspect known node identities and properties instead. [Preserve multi-node DOM output](/explore/wire-and-rendered-dom-output)
explains the persistent range representation and consuming conversions.

## Test the adapter's promises

At construction, assert `event.valueOf() === canvas`. After an internal update, assert that the
host still contains the same canvas. At interruption, assert the periodic producer or foreign teardown stops
exactly once. If placement can reorder output, separately test native state required by the product;
node identity and state-preserving platform movement are different guarantees.

Those assertions cover output transport, ongoing ownership, and resource release. A screenshot of
the final pixels covers none of the cleanup contract. Continue with the
[DOM output recipe](/integrate/dom-output) for a fuller adapter and the
[RenderEvent reference](/reference/modules/%40typed%2Ftemplate%2FRenderEvent) for the public carrier.
