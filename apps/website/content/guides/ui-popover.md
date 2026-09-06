---
title: "Popover: supporting content in the top layer"
summary: "Build a manual popover with explicit dismissal and honest focus expectations."
section: "UI / Overlays"
kind: "deep-dive"
order: 282
---

A popover is useful for a compact legend, explanation, or supporting panel that should escape ordinary stacking and clipping. It is not automatically a menu, dialog, or positioned floating panel. Typed `Popover.Content` uses a `<div popover="manual">`; browser top-layer behavior and your interaction semantics are separate decisions.

Read [overlay selection](/explore/overlays-disclosure-and-transient-ui) and [component construction](/explore/ui-component) first. MDN distinguishes manual popovers from auto popovers: manual surfaces do not receive auto light dismissal. Typed adds local Escape handlers, not a document-wide dismissal manager. See [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API).

## Build a chart legend

Pass a stable, page-unique ID for each legend. The visible close action works on touch as well as keyboard. A named region describes the content without claiming modal behavior.

```ts
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Button from "@typed/ui/Button";
import * as Popover from "@typed/ui/Popover";

const ChartLegend = component(function* (id: string) {
  const state = yield* Popover.makeState();
  return [
    Popover.Trigger({ state, controls: id, content: "Explain chart colors" }),
    Popover.Content({
      state,
      props: { id },
      content: html`
        <section aria-labelledby=${`${id}-title`}>
          <h2 id=${`${id}-title`}>Revenue legend</h2>
          <ul><li>Green: recognized revenue</li><li>Gray: forecast revenue</li></ul>
          ${Button.Button({ content: "Close legend", onclick: Popover.setOpen(state, false) })}
        </section>
      `,
    }),
  ];
});
```

`Trigger.controls` emits `popovertarget` and `popovertargetaction="show"`; match it to the actual content element's `props.id`. It opens rather than toggles. When `controls` is absent, the click Effect sets `open` true instead. Neither route supplies positioning: use CSS appropriate to your layout and check zoom, scrolling, and small viewports.

## Follow both state directions

`makeState` creates hydrated `{ open: false }` state unless initialized otherwise. `NativePopover.ref` observes it and invokes show/hide methods. `Content` reports the completed `toggle` event back into state through `Dom.toggleState`; real toggle events expose `newState`. It waits for the completed transition because synchronizing during `beforetoggle` would call show/hide again while the browser is already transitioning. A caller can still use `props.onbeforetoggle` to cancel a native opening. A plain synthetic `Event("toggle")` has no such field and is not an accurate open event.

Escape on the trigger or inside content prevents the key default and sets state false. If focus has moved elsewhere, these local listeners cannot observe it. Outside click does not close this manual popover. Do not tell users a panel dismisses on blur or traps focus unless you implement and test that additional contract. For commands use [Menu](/explore/ui-menu); for a modal task use [Dialog](/explore/ui-dialog).

## Keep semantics and lifetime visible

`Popover.Content` adds no specialized ARIA role. The author chooses suitable content structure, names, focus order, and explicit dismissal. If the panel requires an initial focus move, that remains application work; opening a generic manual popover is not a guarantee of a dialog-like focus policy.

Its parts are lazy Fx values. The resulting errors and services include dynamic props, content, event Effects, and custom host requirements; `makeState` adds its hydration/schema requirements. The mounted Scope owns native observation and listeners. A host override must retain the actual popover element, all toggle/key handlers, and the composed hydration ref.

When state says open but the surface stays hidden, check the `popover` attribute, browser API availability, connection, and ref before investigating CSS. When a target button does nothing, verify the ID and native target support; omitting `controls` switches to the state click path but still requires native Popover API support for content.

Continue with [NativePopover](/explore/ui-native-popover) for application-owned markup or [Tooltip](/explore/ui-tooltip) for descriptive hover/focus content. API: [Popover](/reference/modules/%40typed%2Fui%2FPopover).
