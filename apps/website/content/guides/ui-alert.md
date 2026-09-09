---
title: "Alert: urgent messages without moving focus"
summary: "Reference assertive live-region timing and the recovery action an alert should point to."
section: "UI / Foundations"
kind: "reference"
order: 211
---

<span id="keep-the-region-mounted-and-update-its-text"></span>
<span id="state-and-focus-belong-to-different-boundaries"></span>
<span id="make-the-recovery-readable-and-persistent"></span>

`Alert` supplies `role="alert"` without moving focus. Mount the region, then update its text for an urgent change; an alert already present at page load may not be announced. Keep a recovery control near a failure rather than placing interactive content in the alert.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Alert } from "@typed/ui/Alert";
import { Button } from "@typed/ui/Button";
import { component } from "@typed/template";

export const UploadStatus = component(function* () {
  const message = yield* RefSubject.make("");
  return html`${Alert({ content: message })}${Button({
    content: "Simulate upload failure",
    onclick: RefSubject.set(message, "Upload failed. Try again."),
  })}`;
});
```

See the [Alert API](/reference/modules/%40typed%2Fui%2FAlert) and the save failure path in [building UI components](/explore/building-ui-components).
