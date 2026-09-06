---
title: "SpinButton: numeric entry at the change boundary"
summary: "Use native number entry while keeping empty drafts, finite state, bounds, and commit timing explicit."
section: "UI / Forms"
kind: "guide"
order: 237
---

Numeric entry is not always a valid number while someone is typing. An empty field, a sign, or a partial exponent can be a legitimate editing step. `SpinButton` is intentionally a thin native number input backed by one numeric value, not a complete draft/validation editor. Choose [Form.NumberInput](/explore/ui-form) when you need schema decoding and displayed field errors.

The module exposes `State`, `InitialState`, `StateSchema`, `makeState`, `setValue`, and the `SpinButton` renderer. State stores a `number`; its hydration schema is `Schema.Finite`. Options accept reactive `min`, `max`, and `step`, plus native host metadata through props.

## Render a quantity with a clear unit

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
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

This example demonstrates native numeric entry and a derived display. It is not a request validator; a print service should still reject a count outside its supported range. A phone number or postal code should usually remain a string input because leading zeroes and formatting are data, not arithmetic.

## The current implementation commits on change

The renderer sets `type="number"`, the initial value attribute, and reactive `.value`. Its internal listener is `change`, not `input`, and reads `valueAsNumber` into `setValue`. Consequently the derived summary reflects committed native changes rather than every intermediate keystroke. Compare [Slider](/explore/ui-slider), which publishes on input while dragging.

Do not infer runtime validation from the hydration schema: `setValue` directly updates the subject. Empty or invalid native number text can yield `NaN`, and the handler does not filter it before assignment. If your product must preserve partial input, errors, or an optional number, choose a draft-string/decoded-value design or the Form abstraction instead of relying on this primitive to invent one. Investigate empty/change behavior in the target browser before using this for consequential values.

Likewise min/max/step configure browser constraints and stepping, not programmatic clamping. The [MDN number-input reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/number) explains constraint validation and optional native stepper controls. Keep server/domain validation independent from those attributes.

The [APG spinbutton pattern](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/) discusses changing values while retaining normal text-editing keys. Typed's default host inherits its behavior from the browser and does not install custom arrow/Home/End handling. Do not intercept every key to enforce numeric characters: that can break editing, input methods, and assistive technology.

## Check focus and drafts before custom styling

Set a comfortable input width, visible units, and a clear `:focus-visible` outline. Hiding native stepper affordances changes discoverability even if keyboard entry remains possible. If you add adjacent decrement/increment buttons, give them names and define bounds consistently with direct entry; they are application controls, not hidden features of this primitive.

When value updates appear delayed, confirm the intended change timing. When the field resets while typing, inspect external `.value` updates. When a hydrated render fails, inspect whether invalid numeric state entered the subject earlier. Custom hosts must preserve a native input and its numeric properties. The [SpinButton API](/reference/modules/%40typed%2Fui%2FSpinButton) provides the exact thin contract.
