---
title: "Button: actions with native activation"
summary: "Reference native action activation, button types, disabled behavior, and Effect handlers."
section: "UI / Forms"
kind: "reference"
order: 230
---

<span id="make-the-action-visible-in-state"></span>
<span id="distinguish-activation-from-submission"></span>
<span id="style-the-host-without-replacing-its-contract"></span>

`Button` renders a native button and defaults to `type: "button"`. Use `submit` only at a form's submit boundary and use `disabled` for native interaction suppression. The handler remains an Effect with its own error and service requirements.

```ts
import { Button } from "@typed/ui/Button";

export const SaveButton = Button({ type: "button", content: "Save draft" });
```

A repeated action needs explicit state such as `aria-pressed`; a destination is a [Link](/explore/ui-link). See the [Button API](/reference/modules/%40typed%2Fui%2FButton) and the [save-control walkthrough](/explore/building-ui-components).
