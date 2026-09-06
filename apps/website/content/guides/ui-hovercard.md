---
title: "Hovercard: keep interactive previews reachable"
summary: "Preserve pointer and focus transfer into a named non-modal preview."
section: "UI / Overlays"
kind: "deep-dive"
order: 287
---

An author preview can contain a profile link. That makes it different from a tooltip: focus must be allowed into the content. Typed `Hovercard.Content` uses a named `role="dialog"` manual popover; it is non-modal and does not trap focus or make the surrounding page inert.

Prerequisites: [Tooltip](/explore/ui-tooltip) for descriptive popups and [Popover](/explore/ui-popover) for native top-layer behavior. There is no dedicated APG hovercard pattern; do not claim modal-dialog conformance for a manual popover. Choose [Dialog](/explore/ui-dialog) when a task genuinely needs modal interaction.

## Offer an author preview with a permanent destination

```ts
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Hovercard from "@typed/ui/Hovercard";

const AuthorPreview = component(function* (id: string) {
  const state = yield* Hovercard.makeState({ id });
  return [
    Hovercard.Anchor(
      { state, content: "Ada Lovelace", showDelay: 150, hideDelay: 150 },
      (props, content) => html`<a href="/authors/ada" ...${props}>${content}</a>`,
    ),
    Hovercard.Content({
      state,
      labelledBy: `${id}-title`,
      content: html`
        <h2 id=${`${id}-title`}>Ada Lovelace</h2>
        <p>Author of notes on computation and analytical machines.</p>
        <a href="/authors/ada">Read the full profile</a>
      `,
    }),
  ];
});
```

The anchor itself stays a usable link. Its direct focus listeners now run on the focusable host; placing a link inside the default span would not deliver non-bubbling focus to that span. Pass a stable, page-unique instance ID. That state ID links `aria-controls` to the content. `label` and `labelledBy` are mutually exclusive; the example chooses a visible heading.

## Trace transfer rather than just opening

Anchor focus or mouse entry schedules opening; blur checks `relatedTarget` and stays open when focus moves inside the content. Content `focusin` keeps it open; `focusout` closes only when the next target is outside the card. Pointer entry cancels older scheduled closure by advancing the per-state schedule version. On content mouseleave, the related target's `aria-controls` is checked before closing, allowing a direct return to the anchor.

Escape inside either participating host schedules immediate closure. The default delays are zero, so choose a hide delay when a small pointer gap must be crossed. This is a delay policy, not geometric intent detection: the implementation does not track pointer triangles, automatically place the card, or implement touch-specific activation.

The browser provides native popover visibility and top-layer placement. The element uses `popover="manual"`; it does not receive auto light dismissal. See [MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API). Focus may leave the card normally, and there is no automatic initial focus transfer promised on opening.

## Keep the preview optional

Do not require hovering to reach the profile or another essential action. Keyboard users should be able to focus the anchor, inspect the preview, follow its link, and leave. Check the actual DOM order: visual positioning near the anchor does not reorder sequential keyboard navigation. Use the [APG keyboard guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) when assessing focus visibility and navigation.

The state creator adds hydrated-state Scope/schema requirements; the Fx preserves dynamic content and callback errors/services. The rendered Scope owns delay Effects, event listeners, and native observation. `Hovercard.Hovercard` aliases `Content`; `setOpen` is available to an explicit application controller.

If a preview collapses while tabbing into it, inspect the content ID, `aria-controls`, DOM containment, and `relatedTarget`. If it opens with a mouse but not a keyboard, inspect the actual host receiving focus. If custom styling makes it disappear, verify the spread still includes the native popover/ref and role/name props. Test rapid transitions and unmounting during a delay as well as the steady visible state.

Next: [Dom host contracts](/explore/ui-dom) for safe overrides or [Dialog](/explore/ui-dialog) for modal tasks. API: [Hovercard](/reference/modules/%40typed%2Fui%2FHovercard).
