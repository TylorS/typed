---
title: "Slider: continuous native range input"
summary: "Connect input-time numeric updates to an accessible range control and an explicit domain value."
section: "UI / Forms"
kind: "guide"
order: 236
---

A slider is useful when position conveys a value and rough adjustment is more useful than typing an exact number. Volume, zoom, and preview intensity fit that shape. Use [SpinButton](/explore/ui-spin-button) when exact numeric entry matters. Typed's Slider retains a native `<input type="range">`; it does not implement a custom thumb or multi-thumb range.

`State` contains one numeric `value`. `makeState({ value })` hydrates it through `Schema.Finite`, and `setValue` updates it. `SliderOptions` requires state and accepts reactive `min`, `max`, and `step`, including `"any"` for step. Labels, IDs, names, and other native metadata travel through `props`.

## Show the number that position represents

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
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

The [APG slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) describes accessible naming, value semantics, arrows, and endpoint movement. This implementation delegates keyboard behavior to the native input instead of duplicating those handlers. Test the actual browser and assistive technology you support, especially touch input; using the APG role vocabulary is not a certification of a custom host.

## Preserve a usable track across themes

Start with native range styling and `accent-color`. If styling vendor-specific track/thumb pseudo-elements, retain adequate thumb size and a focus indicator in light, dark, and forced-color modes. A non-focusable painted track next to an invisible input can create a mismatch between the visible target and the keyboard target.

A custom host must still supply a range input if you expect native keyboard, pointer, and form behavior. Copying attributes onto a div does not implement dragging. If state updates only after release, check that your consumer is observing the subject rather than a separate change listener. If the thumb jumps, inspect programmatic writes and bound changes. See the [Slider API](/reference/modules/%40typed%2Fui%2FSlider), [Meter](/explore/ui-meter) for read-only quantities, and [Form](/explore/ui-form) for schema-bound RangeInput.
