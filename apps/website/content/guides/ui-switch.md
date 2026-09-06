---
title: "Switch: a stable name for an on/off setting"
summary: "Model a binary setting with native button activation and explicit persistence and form participation."
section: "UI / Forms"
kind: "guide"
order: 233
---

A switch communicates whether a setting is on or off. Its label names the setting and stays stable as the value changes. `Switch` uses a native button with `role="switch"`; it is useful for settings that can be expressed as a boolean independently of a form submission. Compare [Checkbox](/explore/ui-checkbox) when the interaction is selecting an option to submit later.

The module's `State` contains `checked: boolean`. `makeState` defaults it to false, `setChecked` assigns it, and `toggle` inverts it. There is no mixed state. `SwitchOptions` requires `state` and `content`; ordinary host props and events remain available.

## Show the state without renaming the setting

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Switch from "@typed/ui/Switch";

export const PreviewSetting = component(function* () {
  const state = yield* Switch.makeState({ checked: true });
  const status = RefSubject.map(state, ({ checked }) => checked ? "On" : "Off");
  return html`<section>
    ${Switch.Switch({
      state,
      content: "Show live preview",
      props: { class: "preview-switch", "aria-describedby": "preview-setting-help" },
    })}
    <span aria-hidden="true">${status}</span>
    <p id="preview-setting-help">Updates the preview while you edit.</p>
  </section>`;
});
```

The visible On/Off text supplements the control while the accessible state comes from `aria-checked`. Do not include alternating “Enable” and “Disable” text in the switch name. A user should be able to identify the same setting before and after activation. Give repeated instances unique description IDs.

## Separate local state from saved state

The internal click Effect toggles the subject. The native button supplies Enter and Space activation and receives `type="button"`, so the switch does not submit its enclosing form. The [APG switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) defines on/off semantics and a stable accessible label; Typed supplies the role and checked state while the consumer supplies that name.

A toggle does not save anything by itself. Decide whether the state is a local preference, a draft setting, or an optimistic server update. For asynchronous persistence, expose pending/failure feedback and define whether to restore the old value after rejection. Avoid attaching a second `toggle` in a consumer click handler: user handlers are composed with the internal action, so two inversions can leave the setting unchanged.

A button-backed switch is not a successful named checkbox control in native form data. For a conventional form boolean use the schema-bound `Form.Checkbox`, or explicitly include this subject's boolean in the submitted application model. An `aria-checked` attribute alone is not serialized as a form field.

## Design the track and thumb around the real button

Style `props.class`, `[aria-checked="true"]`, and `:disabled` rather than maintaining a second CSS-only state. A decorative thumb should not be independently focusable. Preserve a visible focus ring around the entire target and a non-color distinction between on and off. Native disabled state can be supplied through `props.disabled`; it affects the actual button rather than merely describing it.

When activation appears ineffective, compare the subject and rendered `aria-checked`, then inspect duplicate toggles or a canceled event. When keyboard operation fails after customization, check that the custom host remained a button and retained its props/ref. The [Switch API](/reference/modules/%40typed%2Fui%2FSwitch) documents state transitions; [Form](/explore/ui-form) explains submission ownership.
