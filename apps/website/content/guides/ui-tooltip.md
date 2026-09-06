---
title: "Tooltip: a description that survives pointer and keyboard use"
summary: "Connect a stable description ID, focusable anchor, delays, and manual popover content."
section: "UI / Overlays"
kind: "deep-dive"
order: 286
---

A tooltip adds a short description to an already understandable control. It must not be the only place to find required instructions or an essential action. Typed connects its anchor through `aria-describedby` to a manual popover with `role="tooltip"`; the description does not receive an interactive dialog contract.

Start with [Popover](/explore/ui-popover) and [component construction](/explore/ui-component). The [APG tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) distinguishes descriptive content from focusable popup content and notes that the pattern is still work in progress. Use [Hovercard](/explore/ui-hovercard) for a link or button inside the popup.

## Describe a refresh control

The default anchor is a span. This example puts its provided props on the actual button so keyboard focus reaches the element that owns the tooltip handlers.

```ts
import { Effect } from "effect";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Tooltip from "@typed/ui/Tooltip";

const RefreshWithHelp = component(function* <R>(id: string, refresh: Effect.Effect<void, never, R>) {
  const state = yield* Tooltip.makeState({ id });
  return [
    Tooltip.Anchor(
      { state, showDelay: 250, hideDelay: 100, content: "Refresh", onclick: refresh },
      (props, content) => html`<button type="button" ...${props}>${content}</button>`,
    ),
    Tooltip.Content({ state, content: "Fetch the latest values without changing your filters." }),
  ];
});
```

Pass the real refresh Effect and a stable, page-unique ID. Its required services remain in the view’s inferred type. The action name remains visible. The text explains its consequences. Use an instance-specific deterministic ID if several refresh controls appear together; duplicate IDs can describe the wrong control and confuse pointer-transfer checks.

## Follow the interaction sequence

`makeState` requires `id` and defaults `open` to false. `Anchor` schedules open on mouse entry or direct focus, close on departure or blur, and immediate close on Escape. `showDelay` and `hideDelay` default to zero. A version counter per state invalidates older delayed updates, so a stale scheduled close cannot overwrite a newer scheduled open.

Content mouse entry schedules immediate open. Content departure checks whether the related target describes itself with this tooltip ID, allowing movement back to the anchor without a close. The content uses `NativePopover.ref` and reports `toggle` to state. Rendering owns delayed handler work and native observation; stopping that Scope ends the mounted interaction.

These are direct host focus/blur listeners, not bubbling focusin/focusout on the default anchor. A nested button inside an unfocusable span does not fix keyboard opening. Either set `props: { tabindex: 0 }` on the span itself or, for an existing control, use a focusable custom host as above. Forward the complete props object so `aria-describedby`, key, pointer, and focus handlers remain together.

## Test the gaps a screenshot cannot show

Check keyboard focus opens the description, Escape closes it, and moving pointer from anchor to content keeps it available. Also test quick enter/leave sequences longer than both delays, and unmount while a delay is pending. A visible tooltip alone does not prove these transitions.

The implementation does not provide automatic collision-aware positioning, touch-specific long-press behavior, or a full focus-versus-hover arbitration policy. If your required interaction includes these, implement and test them at an appropriate owner. Do not infer automatic anchoring from top-layer rendering. The underlying platform behavior is documented in [MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API).

E and R include hydrated state acquisition and any Effectful content, callbacks, or host output. `setOpen` updates state without supplying those requirements; `Tooltip.Tooltip` aliases `Content`. A custom ref must preserve exactly one hydration owner. Continue with [Dom events and refs](/explore/ui-dom) for composition details. API: [Tooltip](/reference/modules/%40typed%2Fui%2FTooltip).
