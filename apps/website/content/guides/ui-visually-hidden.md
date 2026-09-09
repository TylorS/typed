---
title: "VisuallyHidden: retain meaning without visual layout"
summary: "Reference clipped accessible text and the limitation for focusable content."
section: "UI / Foundations"
kind: "reference"
order: 215
---

<span id="give-an-icon-button-an-explicit-name"></span>
<span id="visual-hiding-and-semantic-hiding-have-opposite-goals"></span>
<span id="do-not-hide-keyboard-focus"></span>

`VisuallyHidden` clips text while retaining it in the accessibility tree. Use it to name an icon-only control; do not use it to conceal focusable content that a keyboard user must find.

```ts
import { html } from "@typed/template";
import { Button } from "@typed/ui/Button";
import { VisuallyHidden } from "@typed/ui/VisuallyHidden";

export const CloseButton = Button({
  content: html`<span aria-hidden="true">×</span>${VisuallyHidden({ content: "Close dialog" })}`,
});
```

This is visual clipping, not semantic hiding: `hidden`, `display: none`, and `aria-hidden="true"` remove text from the intended accessibility relationship. Test the button's accessible name, and do not hide focusable content this way. [VisuallyHidden API](/reference/modules/%40typed%2Fui%2FVisuallyHidden).
