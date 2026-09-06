---
title: "VisuallyHidden: retain meaning without visual layout"
summary: "Provide accessible text with clipping while distinguishing visual hiding, semantic hiding, and focus visibility."
section: "UI / Foundations"
kind: "guide"
order: 215
---

Sometimes a compact interface has room for an icon but still needs words for an accessible name. `VisuallyHidden` keeps those words in the document and accessibility tree while clipping their visual box. It is a small styling primitive, not a label relationship manager, live region, or focus-aware skip-link system.

`VisuallyHiddenOptions` requires renderable `content`. The default host is a span with inline clipping styles: absolute positioning, a one-pixel box, negative margin, hidden overflow, zero border/padding, and no wrapping. There is no state model or keyboard behavior.

## Give an icon button an explicit name

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Button } from "@typed/ui/Button";
import { component } from "@typed/ui/Component";
import { VisuallyHidden } from "@typed/ui/VisuallyHidden";

export const ResetCounter = component(function* () {
  const count = yield* RefSubject.make(3);
  return html`<div>
    <p>Selected items: ${count}</p>
    ${Button({
    content: html`
      <span aria-hidden="true">×</span>
      ${VisuallyHidden({ content: "Clear selection" })}
    `,
    props: { class: "icon-action" },
    onclick: RefSubject.set(count, 0),
    })}
  </div>`;
});
```

The glyph is decorative because the hidden text supplies the action's name. Activating the button clears the selected count and updates the visible readout. In a selection editor, connect this same command to the selected item collection rather than keeping a separate count. A simple `aria-label` on the button is another naming option; choose one clear name rather than layering contradictory alternatives.

## Visual hiding and semantic hiding have opposite goals

`display: none`, the `hidden` attribute, and `aria-hidden="true"` do not serve the same purpose as clipping. The first two remove content from ordinary rendering; aria-hidden removes it from accessibility exposure. Do not put VisuallyHidden inside an aria-hidden ancestor and expect it to contribute a name. [MDN's aria-hidden reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden) explains inherited accessibility hiding and its risks around focusable content.

There is no dedicated interactive APG pattern for this span. Evaluate the pattern of the control using its text, such as [Button](/explore/ui-button) or [Link](/explore/ui-link). The primitive's job is preserving textual meaning while changing its visual presentation.

A hidden instruction still needs a relationship if it describes another control: give the span an ID and reference it through `aria-describedby`. Hidden text is not automatically announced when it changes. For urgent announcements, [Alert](/explore/ui-alert) supplies a separate live-region contract. Keep essential instructions visible when all users need them rather than hiding important product guidance to simplify the layout.

## Do not hide keyboard focus

Avoid placing focusable links, buttons, or form controls inside this primitive. Its clipping recipe does not reveal content when a descendant receives focus. A skip link needs additional focus-visible styling that makes it visible when reached; VisuallyHidden alone is insufficient. If an icon button's hidden name works but its focus indicator disappears, style the actual button rather than the hidden span.

Custom host rendering must preserve the supplied style and content. Consumer styles that override position, width, clip, or overflow can accidentally expose the text or hide too much. The implementation uses the legacy CSS clip recipe; [MDN's clip reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/clip) documents that property. Do not assume the component supplies a newer clip-path strategy.

Inspect the accessible name in browser tools and keyboard through the resulting control. A screenshot cannot show whether the naming relationship survived. The [VisuallyHidden API](/reference/modules/%40typed%2Fui%2FVisuallyHidden) documents its minimal host contract; [Group](/explore/ui-group) shows explicit label relationships.
