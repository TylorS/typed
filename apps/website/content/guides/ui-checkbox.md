---
title: "Checkbox: boolean choices and mixed summaries"
summary: "Connect native checked and indeterminate properties to one hydrated state without confusing mixed presentation with submitted data."
section: "UI / Forms"
kind: "guide"
order: 232
---

A checkbox expresses an independently selectable option. Several checkboxes may all be selected; mutually exclusive choices belong in [RadioGroup](/explore/ui-radio-group). The `Checkbox` module separates a renderer-independent state from the native input so bulk actions and individual edits can share an explicit model.

`Checked` is `boolean | "mixed"`. `makeState({ checked })` defaults to false and creates a hydrated subject. `setChecked` accepts all three states; `toggle` maps true to false and both false and mixed to true. None of those operations automatically derives a parent checkbox from a collection of children.

## Name the input and expose the model

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import * as Checkbox from "@typed/ui/Checkbox";
import { component } from "@typed/ui/Component";

export const UpdatePreference = component(function* () {
  const state = yield* Checkbox.makeState({ checked: false });
  const message = RefSubject.map(state, ({ checked }) =>
    checked === true ? "Product updates enabled" : "Product updates disabled",
  );
  return html`<div class="preference">
    <label>
      ${Checkbox.Input({ state, props: { name: "updates", value: "yes" } })}
      Receive product updates
    </label>
    <p>${message}</p>
  </div>`;
});
```

Wrapping the input in a label provides naming and click-target behavior without inventing an ID. For a separate label, supply a stable input ID and matching `for`. The Input borrows state; create shared state in the enclosing component when other controls need it.

## Three state values, two native properties

The renderer maps true to both the checked attribute and `.checked` property. Mixed sets `.indeterminate` and `aria-checked="mixed"`, while `.checked` is false. A native change event reads the input's actual checked property and writes a boolean back to state. Do not add `onclick: Checkbox.toggle(state)` to this input: the native change handler already commits activation and an extra toggle can undo it.

The [APG checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/) describes Space activation and a mixed state for partially selected groups. Here the browser implements activation. For a select-all control, derive mixed/true/false from the child selection and define the action that updates all children together. A standalone mixed state is only a presentation; it does not encode the individual selections.

Native form submission includes checked checkboxes with their name/value, while an unchecked checkbox is absent. Indeterminate is a DOM property, not a third submitted value. Decide whether a request needs omission, a boolean, or the underlying selection list. [MDN's checkbox reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox) explains these native distinctions. Use [Form](/explore/ui-form) when a schema-bound boolean should participate in the form's decoded values.

## Keep styling subordinate to interaction

Start with native appearance and `accent-color`; preserve `:focus-visible`, disabled feedback, and adequate label spacing. If drawing a separate visual check, hide only decorative marks from assistive technology and keep the actual input usable. `display: none` removes the input's keyboard interaction. Mixed styling should be visibly different from checked, not merely a different color.

When state and appearance disagree, inspect both `.checked` and `.indeterminate`; HTML attributes alone cannot show the complete state. If reset only changes the browser presentation, coordinate resetting the subject or use the form-bound control. Custom hosts must retain input type, both properties, ARIA state, the change handler, and hydration ref. See the [Checkbox API](/reference/modules/%40typed%2Fui%2FCheckbox) and [Switch](/explore/ui-switch) for the distinct on/off contract.
