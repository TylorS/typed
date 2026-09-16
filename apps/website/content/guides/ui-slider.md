---
title: "Slider: continuous native range input"
summary: "Reference range input timing and the distinction between user changes and programmatic bounds."
section: "UI / Forms"
kind: "reference"
order: 236
---

A slider is useful when position conveys a value and rough adjustment is more useful than typing an exact number. Volume, zoom, and preview intensity fit that shape. Use [SpinButton](/explore/ui-spin-button) when exact numeric entry matters. Typed's Slider retains a native `<input type="range">`; it does not implement a custom thumb or multi-thumb range.

`makeState({ value })` creates the numeric state. The range accepts reactive `min`, `max`, and
`step`; labels, IDs, and native metadata travel through `props`.

## Show the number that position represents

```ts
import { RefSubject } from "@typed/fx";
import { html, component } from "@typed/template";
import * as Slider from "@typed/ui/Slider";

export const ZoomControl = component(function* () {
  const state = yield* Slider.makeState({ value: 100 });
  const percentage = RefSubject.map(state, ({ value }) => `${value}%`);

  return html`<div class="zoom-control">
    <label for="preview-zoom">Preview zoom</label>
    ${Slider.Slider({
      state, min: 50, max: 200, step: 10,
      props: { id: "preview-zoom", name: "zoom", "aria-valuetext": percentage },
    })}
    <output for="preview-zoom">${percentage}</output>
  </div>`;
});
```

The output exposes a readable value without requiring users to infer it from thumb position. `aria-valuetext` gives the numeric value its percent unit. If visual units and accessible units differ, define that conversion once from state rather than computing two unrelated strings.

## Input events are a deliberate timing choice

Slider listens to native `input` and reads `valueAsNumber`, so dragging can publish many state changes. The renderer writes the value attribute and current `.value` property from the same subject. For an expensive preview, derive a sampled or debounced work stream outside the input, while letting the local value display stay responsive. The primitive does not automatically throttle updates or save on pointer release.

Native min/max/step constrain browser interaction. They do not add a matching domain validator to `setValue`: its implementation assigns the supplied number. Setting an out-of-range number programmatically can make the browser's sanitized range value disagree with the subject. Clamp or validate at the application boundary, and maintain min ≤ max with a compatible step. [MDN's range reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/range) explains browser defaults and sanitization.

Keyboard movement comes from the native range input. Keep that host and a visible focus indicator
when styling the track or thumb.

## Preserve a usable track across themes

Use native range styling or its track/thumb pseudo-elements while keeping the keyboard target
visible. If the thumb jumps, inspect programmatic writes and changes to min/max. If the display
updates only after release, check that it observes Slider state rather than a separate change listener.

See the [Slider API](/reference/modules/%40typed%2Fui%2FSlider), [Meter](/explore/ui-meter) for
read-only quantities, and [Form](/explore/ui-form) for schema-bound RangeInput.
