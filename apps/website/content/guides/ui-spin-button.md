---
title: "SpinButton: numeric entry at the change boundary"
summary: "Reference numeric input timing, bounds, and invalid draft limitations."
section: "UI / Forms"
kind: "reference"
order: 237
---

Numeric entry is not always a valid number while someone is typing. An empty field, a sign, or a partial exponent can be a legitimate editing step. `SpinButton` is intentionally a thin native number input backed by one numeric value, not a complete draft/validation editor. Choose [Form.NumberInput](/explore/ui-form) when you need schema decoding and displayed field errors.

State stores a number. Options accept reactive `min`, `max`, and `step`, plus native metadata
through props; see the [SpinButton API](/reference/modules/%40typed%2Fui%2FSpinButton) for the full surface.

## Render a quantity with a clear unit

```ts
import { RefSubject } from "@typed/fx";
import { html, component } from "@typed/template";
import * as SpinButton from "@typed/ui/SpinButton";

export const CopyCount = component(function* () {
  const state = yield* SpinButton.makeState({ value: 1 });
  const summary = RefSubject.map(state, ({ value }) => `Copies requested: ${value}`);

  return html`<div class="copy-count">
    <label for="print-copies">Number of copies</label>
    ${SpinButton.SpinButton({
      state, min: 1, max: 100, step: 1,
      props: { id: "print-copies", name: "copies", required: true },
    })}
    <p>${summary}</p>
  </div>`;
});
```

This example demonstrates native numeric entry and a derived display. A phone number or postal code should usually remain a string input because leading zeroes and formatting are data, not arithmetic.

## The current implementation commits on change

The renderer sets `type="number"`, the initial value attribute, and reactive `.value`. Its internal listener is `change`, not `input`, and reads `valueAsNumber` into `setValue`. Consequently the derived summary reflects committed native changes rather than every intermediate keystroke. Compare [Slider](/explore/ui-slider), which publishes on input while dragging.

Do not infer runtime validation from the hydration schema: `setValue` directly updates the subject. Empty or invalid native number text can yield `NaN`, and the handler does not filter it before assignment. Use a separate draft string when partial input must remain visible. Form.NumberInput adds decoding and field errors, but it does not generally preserve arbitrary invalid drafts either.

Likewise min/max/step configure browser constraints and stepping, not programmatic clamping. The [MDN number-input reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/number) explains constraint validation and optional native stepper controls. Keep server/domain validation independent from those attributes.

The [APG spinbutton pattern](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/) discusses changing values while retaining normal text-editing keys. Typed's default host inherits its behavior from the browser and does not install custom arrow/Home/End handling. Do not intercept every key to enforce numeric characters: that can break editing, input methods, and assistive technology.

## Check focus and drafts before custom styling

Keep the native number input and its focus indicator. A delayed display can be expected `change`
timing; a field that resets during typing can indicate external `.value` updates. Test empty input
followed by a committed change so invalid numeric state cannot pass unnoticed into later work.
