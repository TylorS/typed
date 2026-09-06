---
title: "Select: a popover-backed list of choices"
summary: "Assemble trigger, content, and options while making keyboard collection and native form differences explicit."
section: "UI / Forms"
kind: "guide"
order: 235
---

`@typed/ui/Select` is a custom choice surface built from a button, a native popover, and listbox options. It is different from `Form.Select`, which renders a native `<select>`. Choose the native control when its option rendering and platform picker meet the requirement; use this primitive when the product needs a custom popup presentation. Read [collections and focus](/explore/ui-collections-and-focus) before customizing its items.

## Keep selection, focus, and visibility separate

`makeState` requires a stable `id` and accepts a selected `value`, `open`, `activeId`, and `loop`. Selection is `string | null`; activeId is the currently navigated option, and open controls popover visibility. Moving focus should not silently rewrite the selected value. `select(state, id, value)` commits both identity and value and closes the popup.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Select from "@typed/ui/Select";

export const DensityPicker = component(function* () {
  const state = yield* Select.makeState({ id: "density-options", value: "comfortable" });
  const collection = yield* Select.makeCollection();
  const label = RefSubject.map(state, ({ value }) =>
    value === "compact" ? "Density: compact" : "Density: comfortable",
  );
  return html`<div class="density-picker">
    ${Select.Trigger({ state, content: label })}
    ${Select.Content({
      state, collection,
      content: [
        Select.Option({
          state, collection, id: "density-comfortable", value: "comfortable",
          textValue: "Comfortable", content: "Comfortable",
        }),
        Select.Option({
          state, collection, id: "density-compact", value: "compact",
          textValue: "Compact", content: "Compact",
        }),
      ],
    })}
  </div>`;
});
```

The state ID links the trigger and popover. Each option has a separate ID. The trigger's generated name also labels the listbox. For repeated widgets, derive unique stable IDs per instance; changing IDs independently breaks native invoker relationships.

## Read the implemented keyboard boundary

Trigger is a button with `popovertarget`, `aria-haspopup="listbox"`, and reactive `aria-expanded`. ArrowDown clicks the trigger. Content uses `popover="manual"`; its native toggle event synchronizes state. On opening, a registered matching selected option is focused and scrolled into view. An empty or unmatched initial value does not magically select a first option.

With a collection, Content handles vertical movement, Home/End, buffered typeahead, Enter/Space selection, and Escape closing with invoker focus restoration. Option focus updates activeId; option click commits selection. Supply `textValue` for human-readable typeahead when the stored value is an internal code. Omitting the collection removes this registered keyboard behavior even though pointer selection can still work.

Compare the [APG listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) when designing selection and focus behavior. This module is not an editable combobox and its trigger does not implement text entry. Because the popup is manual, do not assume outside-click light dismissal from the native auto-popover mode; [MDN's popover reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover) distinguishes those modes.

## Integrate without pretending it is a native select

The selected state is not automatically a successful native form field. Include its value in the request model or choose [Form.Select](/explore/ui-form) for native form binding. `Option.disabled` suppresses selection and participates in collection navigation; styling alone must not implement disabled behavior.

Use `[aria-selected="true"]` for committed choice, `:focus-visible` for active navigation, and `:popover-open` for popup styling. Native top-layer placement does not choose your desired dimensions or alignment, so style and test the popup position explicitly. Preserve option roles, tabindex, registration refs, and the popover host when using overrides. Check selection via keyboard, Escape focus return, long-list scrolling, and the null-value opening case in your target browser.

See the [Select API](/reference/modules/%40typed%2Fui%2FSelect), [RadioGroup](/explore/ui-radio-group), and [MDN native select reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select) to compare implementation costs.
