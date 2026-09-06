---
slug: resize-observer
title: Measure a chart host with ResizeObserver
summary: Attach a scoped measurement stream to a template ref and keep the same chart host as its dimensions change.
---

A chart inside a resizable panel needs its container's size, not just the window size. Give that container a template `ref`: Typed passes the exact element to your observer, owns its subscription, and renders the measurements as reactive state.

Prefer CSS container queries for styling alone. Reach for `ResizeObserver` when a canvas or chart renderer needs numeric dimensions.

## Turn measurements into values

Keep the browser API at one small boundary. In `sizes.ts`, subscribing starts observation; stopping the subscription disconnects it.

```ts file="sizes.ts"
import { Effect } from "effect";
import * as Fx from "@typed/fx/Fx";

export interface Size {
  readonly width: number;
  readonly height: number;
}

export const sizes = (element: Element) => Fx.callback<Size>((emit) => {
  const observer = new ResizeObserver((entries) => {
    const entry = entries.find((entry) => entry.target === element);
    if (entry === undefined) return;

    // Report the content box in CSS pixels, without changing its size.
    emit.succeed({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    });
  });
  observer.observe(element);

  // Fx runs this cleanup when the ref's subscription ends.
  return Effect.sync(() => observer.disconnect());
});
```

A newly attached or hidden element can measure zero. Wait for usable dimensions before allocating a chart's drawing buffers; the first observation is not necessarily its final size.

## Attach the stream to the template's host

In `ChartHost.ts`, `ref` connects the observer to the `<div>` that Typed renders. The component owns the measurement state; the ref owns observation of that element.

```ts file="ChartHost.ts"
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import { sizes, type Size } from "./sizes.js";

export const MeasuredChartHost = component(function* () {
  const size = yield* RefSubject.make<Size | null>(null);
  const measure = (element: HTMLDivElement) => sizes(element).pipe(
    // A ref drains its returned Fx for the element's rendering lifetime.
    Fx.tap((value) => RefSubject.set(size, value)),
  );
  const caption = RefSubject.map(size, (value) => value === null
    ? "Waiting for the chart's dimensions…"
    : `${Math.round(value.width)} × ${Math.round(value.height)} CSS pixels`);

  return html`<figure>
    <div
      ref=${measure}
      role="img"
      aria-label="Chart drawing area"
      style="width:100%;height:16rem;min-width:0"
    ></div>
    <figcaption>${caption}</figcaption>
  </figure>`;
});
```

Each rendered instance gets its own host and observer. Measurements update the caption without replacing the host. Removing the template closes the ref subscription and disconnects the observer. See [Reference the native element](/explore/template-references-and-element-access) for ref lifetime and replacement behavior.

Server rendering produces the same host and waiting caption without invoking the DOM ref. Observation begins during browser rendering or hydration. A ref provides the element while the renderer prepares it; it does not promise that layout has finished. Let the observer deliver measurements once the browser has them.

## Resize a chart without rebuilding it

For a real chart, acquire its instance once from the same element ref with `Effect.acquireRelease`, then consume `sizes(element)` to call its resize API. The release action destroys the chart when the ref's scope closes. Creating a chart for every measurement would discard its zoom state and accumulate renderer resources.

The example deliberately keeps a fixed host height and displays measurements outside it. If a resize callback changes the observed box, directly or through surrounding layout, it can trigger an observation loop. Deferring the write to another frame does not fix an unstable sizing equation.

The stream reports CSS pixels. A high-density canvas may need different backing-store dimensions while its CSS box stays unchanged. Check the drawing API's scaling contract before multiplying by device pixel ratio. Content-box and border-box measurements also differ; choose the observer's box option deliberately. The [ResizeObserver reference](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) describes these surfaces.

## Check the lifetime as well as the numbers

In a browser test, resize the parent panel and await the expected measurement. Keep the original host reference and assert that it is still the same node afterward. Change a sidebar's width without resizing the window to catch implementations observing the wrong thing.

Render two instances to check that their measurements stay independent. Hide and reveal one panel, then remove it and verify that its observer disconnects while the other instance continues receiving updates.
