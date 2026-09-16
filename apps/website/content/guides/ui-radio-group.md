---
title: "RadioGroup: one choice and one native group"
summary: "Reference native radio name/value identity and collection-backed keyboard movement."
section: "UI / Forms"
kind: "reference"
order: 234
---

Radio buttons answer one question with one choice. Their group name, selected value, and focus position are related but different concepts. `RadioGroup.State` stores a selected string `value` and composite focus fields; each native Item supplies its own stable ID and value. Use [Checkbox](/explore/ui-checkbox) for independent choices; [collections and focus](/explore/ui-collections-and-focus) explains registration.

## Build the group from real inputs

```ts
import { html, component } from "@typed/template";
import * as RadioGroup from "@typed/ui/RadioGroup";

export const DeliveryChoice = component(function* () {
  const state = yield* RadioGroup.makeState({ value: "standard" });
  const collection = yield* RadioGroup.makeCollection();

  return RadioGroup.Root({
    state,
    collection,
    label: "Delivery speed",
    content: html`
      <label>${RadioGroup.Item({
        state, collection, id: "delivery-standard", name: "delivery", value: "standard",
      })} Standard delivery</label>
      <label>${RadioGroup.Item({
        state, collection, id: "delivery-express", name: "delivery", value: "express",
      })} Express delivery</label>
    `,
  });
});
```

Every Item uses the same `name` because the browser uses that attribute to establish the native radio group. A different logical group needs a different name. IDs identify actual elements for collection lookup and must be unique in the document; values identify application choices. Reusing the same value for two items makes both match the selected state.

## Decide what the collection adds

`Root` renders `role="radiogroup"` and accepts `label`; Item renders an input with `type="radio"`, native checked state, `aria-checked`, name, and value. Native change writes the selected value and active ID together. `setValue(state, value, activeId?)` also allows programmatic selection, but it does not validate that a matching Item exists.

The optional collection registers mounted inputs and lets Root's key handler move to enabled entries and focus them. The current state fixes orientation to vertical, defaults looping to true, and uses real focus. Its composite key handler adds vertical arrow movement plus Home/End; browser native radio handling remains relevant for the other keys. Do not advertise the entire generic Composite keyboard surface as configurable RadioGroup options.

The [APG radio pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) distinguishes ordinary groups from radio groups inside toolbars. This primitive is not an automatic toolbar-radio implementation. Inspect actual keyboard behavior in that composition rather than assuming toolbar focus and selection policies are interchangeable.

## Treat disabled and absent choices deliberately

`ItemOptions.disabled` is a boolean used both by the input and collection registration. Disabled items are unavailable to the native control and skipped by collection movement. Programmatic values are not reconciled against mounted items; removing a selected item does not choose its replacement.

Keep the group's accessible name and each item's label. Style `:focus-visible` separately from
`:checked`: selection and keyboard focus are different states. If two choices stay selected,
inspect shared state, duplicate values, and native names.

The [RadioGroup API](/reference/modules/%40typed%2Fui%2FRadioGroup) lists state and collection
operations; [Select](/explore/ui-select) covers a popup choice surface.
