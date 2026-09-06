---
title: "Meter: communicate a measurement in a known range"
summary: "Explain bounded measurements, threshold semantics, native rendering, and the difference from progress or input."
section: "UI / Foundations"
kind: "guide"
order: 210
---

A meter reports a measurement: storage used, current quota consumption, or a score within a known range. It does not invite editing and it does not represent how far an operation has progressed. `Meter` renders a native `<meter>` and keeps the numerical state separate from its presentation. Read [Slider](/explore/ui-slider) for editable values.

`makeState({ value })` creates a hydrated finite-number state; `setValue` changes that measurement. `MeterOptions` accepts state, reactive `min`, `max`, `low`, `high`, `optimum`, and optional fallback `content`. Labels and descriptions remain the application's job.

## Put scale and units where people can read them

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Meter from "@typed/ui/Meter";

export const StorageUsage = component(function* () {
  const state = yield* Meter.makeState({ value: 64 });
  const description = RefSubject.map(state, ({ value }) => `${value} GB of 100 GB used`);
  return html`<section>
    <label for="storage-meter">Storage used</label>
    ${Meter.Meter({
      state, min: 0, max: 100, low: 60, high: 85, optimum: 0,
      content: description,
      props: { id: "storage-meter", "aria-valuetext": description },
    })}
    <p>${description}</p>
  </section>`;
});
```

The example models lower usage as preferable with `optimum: 0`; that is a product decision, not a universal color rule. A quality score might use a high optimum instead. Visible text supplies exact quantities even when the browser's meter track is very small or its color is unavailable.

## Thresholds describe meaning, not validation

The native host receives the current value and all configured bounds. `low` and `high` divide the range; `optimum` indicates the preferred area. They are not callbacks, warning thresholds that execute code, or constraints checked by `setValue`. If crossing a threshold should trigger application work, derive that policy from state separately and handle repeated samples intentionally.

The [APG meter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/meter/) treats the widget as non-interactive and requires a meaningful name and value information. The default native host carries measurement semantics without custom keyboard handlers. Do not add tabindex solely to make every piece of information a tab stop; it increases keyboard traversal without providing an action.

Keep units consistent across value, bounds, and text. Do not send a fraction from zero to one with a max of one hundred unless you intend to display that fraction as a percentage point. Out-of-range or invalid server data should be handled before calling `setValue`; the state update itself does not clamp values or reconcile thresholds. When thresholds change reactively, update them coherently so the displayed scale remains interpretable.

## Style informational state without hiding the measurement

Use a stable class and surrounding typography/layout tokens. Native meter appearance and pseudo-elements vary across browsers, so test any custom color treatment in the browsers you ship. Pair status colors with readable values or text. A meter is not automatically an announcement: if changing usage is important while the user is elsewhere, decide whether a separate status message is appropriate. Reserve [Alert](/explore/ui-alert) for urgent changes.

If a meter appears full unexpectedly, inspect units and max first. If it announces an unhelpful number, add a unit-bearing value text. If a custom host loses measurement semantics, retain the native meter or deliberately implement the complete ARIA meter attributes yourself; the supplied native `value` prop is not a substitute for `aria-valuenow` on an arbitrary div.

See the [Meter API](/reference/modules/%40typed%2Fui%2FMeter) for the exact state and rendering options, and [Heading](/explore/ui-heading) for structuring the section around related measurements.
